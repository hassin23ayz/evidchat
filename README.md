$ mix phx.new littlechat --live 
$ nvm use 14.15.0
$ cd littlechat 
littlechat$ mix deps.get 
littlechat$ npm install --prefix assets
littlechat$ mix phx.gen.context Organizer Room rooms title:string slug:string

> priv/repo/migrations/20211210112139_create_rooms.exs  : unique field mandate 
> littlechat/organizer/room.ex                          : changeset enhance

$ sudo -u postgres psql
* postgres=# ALTER USER postgres WITH PASSWORD '****';
* postgres=# ALTER ROLE postgres CREATEDB;
* postgres=# ALTER ROLE postgres LOGIN;

> config/dev.exs            : change password of DB
>  littlechat/organizer.ex  : get func edit

littlechat$ mix ecto.create
littlechat$ mix ecto.migrate
littlechat$ iex -S mix phx.server

littlechat/lib/littlechat_web$ mkdir -p live/room

> littlechat/lib/littlechat_web/room/live/new_live.ex
> littlechat/lib/littlechat_web/room/live/show_live.ex
> littlechat/lib/littlechat_web/router.ex

littlechat$ iex -S mix phx.server

> littlechat/lib/littlechat/connected_user.ex   : defstruct is uuid
> littlechat/lib/littlechat_web/room/live/show_live.ex : gen uuid for user

> littlechat/lib/littlechat_web/presence.ex     : link with default pubsub server 

> littlechat/lib/application.ex : Presence Module add at supervision tree 
> littlechat/lib/littlechat_web/room/live/show_live.ex : track the created connected user 

> assets/js/app.js : add media (vid/microphone) access 


