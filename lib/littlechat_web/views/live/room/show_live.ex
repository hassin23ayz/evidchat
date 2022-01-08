# lib/livechat_web/live/room/show_live.ex

defmodule LittlechatWeb.Room.ShowLive do
  @moduledoc """
  A LiveView for creating and joining chat rooms.
  """

  use LittlechatWeb, :live_view

  alias Littlechat.Organizer
  alias Littlechat.ConnectedUser
  alias LittlechatWeb.Presence
  alias Phoenix.Socket.Broadcast


  @impl true
  def render(assigns) do
    ~L"""
    <h1>Room = </h1>
    <h1><%= @room.title %> </h1>

    <h3>Connected Users:</h3>
    <ul>
      <%= for uuid <- @connected_users do %>
          <li>
              <%= uuid %>
          </li>
      <% end %>
    </ul>
    
    <div id="init-stream-req" phx-hook="initStremReq">

    <div class="streams">
      <video 
        id="local-video" playsinline autoplay muted width="600">
      </video>   
    
      <%= for uuid <- @connected_users do %>
        <video 
          id="video-remote-<%= uuid %>" 
          data-user-uuid="<%= uuid %>" 
          playsinline autoplay phx-hook="InitUser">
        </video>
      <% end %>
    </div>

    <button class="button" phx-hook="JoinCall" phx-click="join_call">Hey People let's Join a Call</button>

    <div id="offer-requests">
      <%= for request <- @offer_requests do %>
      <span phx-hook="HandleOfferRequest" data-from-user-uuid="<%= request.from_user.uuid %>"></span>
      <% end %>
    </div>

     <div id="sdp-offers">
       <%= for sdp_offer <- @sdp_offers do %>
       <span phx-hook="HandleSdpOffer" data-from-user-uuid="<%= sdp_offer["from_user"] %>" data-sdp="<%= sdp_offer["description"]["sdp"] %>"></span>
       <% end %>
     </div>

     <div id="sdp-answers">
       <%= for answer <- @answers do %>
       <span phx-hook="HandleAnswer" data-from-user-uuid="<%= answer["from_user"] %>" data-sdp="<%= answer["description"]["sdp"] %>"></span>
       <% end %>
     </div>

     <div id="ice-candidates">
       <%= for ice_candidate_offer <- @ice_candidate_offers do %>
       <span phx-hook="HandleIceCandidateOffer" data-from-user-uuid="<%= ice_candidate_offer["from_user"] %>" data-ice-candidate="<%= Jason.encode!(ice_candidate_offer["candidate"]) %>"></span>
       <% end %>
     </div>

    """
  end

  @impl true
  def mount(%{"slug" => slug}, _session, socket) do
    case Organizer.get_room(slug) do
      nil ->
        {:ok,
          socket
          |> put_flash(:error, "That room does not exist.")
          |> push_redirect(to: Routes.new_path(socket, :new))
        }
      room ->

        user = create_connected_user()
        # Phx Pubsub subscribes the caller(this process) to the PubSub adapter's topic.
        # the server module is listed at the children tree of the application.ex supervisor
        # subscribe(server, topic, opts(optional) )
        Phoenix.PubSub.subscribe(Littlechat.PubSub, "room:" <> slug)
        # Phx liveview is built on channels : so this liveview has a channel too
        # Presence.track , tracks the this liveview's channel process as a presence
        # track(socket, topic, key, meta)
        # Use Presence to track activity of This topic (Room slug as topic)
        # user(key) on a topic(slug) are tracked using presence
        # on each mount->sub_room() call user as key gets added to keys of presence
        {:ok, _} = Presence.track(self(), "room:" <> slug, user.uuid, %{})

        # user subcribes to their own topic 
        Phoenix.PubSub.subscribe(Littlechat.PubSub, "room:" <> slug <> ":" <> user.uuid)

        {:ok,
          socket
          |> assign(:room, room)
          |> assign(:user, user)
          |> assign(:slug, slug)
          |> assign(:connected_users, []) 
          |> assign(:offer_requests, [])  
          # added an empty list for our @offer_requests assign, to keep track of offer requests
          |> assign(:ice_candidate_offers, [])
          |> assign(:sdp_offers, [])
          |> assign(:answers, [])
        }
    end
  end

  # Phoenix Presence broadcasts a message 
  # to connected processes with the event presence_diff

    # when a change happens at the room this handler gets called
  # the call is made by Presence broadcasting the "presence_diff" event
  @impl true
  def handle_info(%Broadcast{event: "presence_diff"}, socket) do
    {
      :noreply,
      socket |> assign(:connected_users, list_present(socket))
    }
  end

  defp list_present(socket) do
    Presence.list("room:" <> socket.assigns.slug) 
    |> Enum.map( fn {k, _} -> k end)
  end


  defp create_connected_user do
    %ConnectedUser{uuid: UUID.uuid4()}
  end

  # each user is subscribed to it's own topic "room:slug:useruuid"
  # another user can publish to that topic thereby communicating with the user 
  defp send_direct_message(slug, to_user, event, payload) do
    LittlechatWeb.Endpoint.broadcast_from(
      self(),
      "room:" <> slug <> ":" <> to_user,
      event,
      payload
      )
  end

  # when a user clicks "Join Call" each connected user to that room gets a message 
  # the following function sends this msg (msg = requesting An Offer ) the offer is to join the call (Hey People let's Join a Call) 
  # Later this msg gets shown at webpage by rendering (using Phx Hook + js )
  @impl true
  def handle_event("join_call", _params, socket) do
    for user <- socket.assigns.connected_users do
      send_direct_message(
        socket.assigns.slug,
        user,
        "request_offers",
        %{
          from_user: socket.assigns.user
        }
      )
    end
    {:noreply, socket}
  end

  @impl true
  @doc """
  When an offer request has been received, add it to the `@offer_requests` list.
  """
  def handle_info(%Broadcast{event: "request_offers", payload: request}, socket) do
    {:noreply,
      socket
      |> assign(:offer_requests, socket.assigns.offer_requests ++ [request])
    }
  end

  # lv.push calls the following handle_event() functions
  # these following 3 handle event functions uses send_direct_message() function to relay forward the webrtc payload to other clients/users
  @impl true
  def handle_event("new_ice_candidate", payload, socket) do
    payload = Map.merge(payload, %{"from_user" => socket.assigns.user.uuid})

    send_direct_message(socket.assigns.slug, payload["toUser"], "new_ice_candidate", payload)
    {:noreply, socket}
  end

  @impl true
  def handle_event("new_sdp_offer", payload, socket) do
    payload = Map.merge(payload, %{"from_user" => socket.assigns.user.uuid})

    send_direct_message(socket.assigns.slug, payload["toUser"], "new_sdp_offer", payload)
    {:noreply, socket}
  end

  @impl true
  def handle_event("new_answer", payload, socket) do
    payload = Map.merge(payload, %{"from_user" => socket.assigns.user.uuid})

    send_direct_message(socket.assigns.slug, payload["toUser"], "new_answer", payload)
    {:noreply, socket}
  end

  # The above handle event functions sends webrtc payload to other clients 
  # These following 3 handle_info functions in turn receives those payloads and acts upon it [rendering, relaying data forward to js webrtc code]
  @impl true
  def handle_info(%Broadcast{event: "new_ice_candidate", payload: payload}, socket) do
    {:noreply,
      socket
      |> assign(:ice_candidate_offers, socket.assigns.ice_candidate_offers ++ [payload])
    }
  end

  @impl true
  def handle_info(%Broadcast{event: "new_sdp_offer", payload: payload}, socket) do
    {:noreply,
      socket
      |> assign(:sdp_offers, socket.assigns.ice_candidate_offers ++ [payload])
    }
  end

  @impl true
  def handle_info(%Broadcast{event: "new_answer", payload: payload}, socket) do
    {:noreply,
      socket
      |> assign(:answers, socket.assigns.answers ++ [payload])
    }
  end

end