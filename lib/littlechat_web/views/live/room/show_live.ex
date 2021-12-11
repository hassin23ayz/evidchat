# lib/livechat_web/live/room/show_live.ex

defmodule LittlechatWeb.Room.ShowLive do
  @moduledoc """
  A LiveView for creating and joining chat rooms.
  """

  use LittlechatWeb, :live_view

  alias Littlechat.Organizer
  alias Littlechat.ConnectedUser

  @impl true
  def render(assigns) do
    ~L"""
    <h1><%= @room.title %></h1>
    <h1><%= @user.uuid %></h1>
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
        {:ok,
          socket
          |> assign(:room, room)
          |> assign(:user, user)
        }
    end
  end

  defp create_connected_user do
    %ConnectedUser{uuid: UUID.uuid4()}
  end
end