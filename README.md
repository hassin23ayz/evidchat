$ mix phx.new littlechat --live 
$ nvm use 14.15.0
$ cd littlechat 
littlechat$ mix deps.get 
littlechat$ npm install --prefix assets
littlechat$ mix phx.gen.context Organizer Room rooms title:string slug:string

> priv/repo/migrations/20211210112139_create_rooms.exs  : unique field mandate 
> littlechat/organizer/room.ex                          : changeset enhance

$ sudo -u postgres psql
* postgres=# ALTER USER postgres WITH PASSWORD 'DBP@55';
* postgres=# ALTER ROLE postgres CREATEDB;
* postgres=# ALTER ROLE postgres LOGIN;

> config/dev.exs            : change password of DB
>  littlechat/organizer.ex  : get func edit

littlechat$ mix ecto.create
littlechat$ mix ecto.migrate
littlechat$ iex -S mix phx.server

