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
    <h1><%= @room.title %></h1>
    <h2>created User now :</h2>
    <h2><%= @user.uuid %></h2>

    <h3>Connected Users:</h3>
    <ul>
    <%= for uuid <- @connected_users do %>
    <li><%= uuid %></li>
    <% end %>
    </ul>

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
        Phoenix.PubSub.subscribe(Littlechat.PubSub, "room:" <> slug)
        {:ok, _} = Presence.track(self(), "room:" <> slug, user.uuid, %{})

        {:ok,
          socket
          |> assign(:room, room)
          |> assign(:user, user)
          |> assign(:slug, slug)
          |> assign(:connected_users, [])
        }
    end
  end

  # Phoenix Presence broadcasts a message 
  # to connected processes with the event presence_diff
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
end