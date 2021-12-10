defmodule LittlechatWeb.PageController do
  use LittlechatWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
