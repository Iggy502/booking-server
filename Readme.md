- This project's database layer was built docker-first, it is recommended to use the included docker compose file to spin up the mongodb containers.
- Using the db without docker requires a local installation of mongodb. (mongod must be running)


## How to run the project

### Prerequisites
- Docker


### Steps
1. Clone the repository
2. Run `docker-compose up` in the root directory of the project
3. The project should now be running on 'localhost:3000' on the host machine
4. The db uses a volume to persist data, so the data should be available after stopping the container
5. When a volume is first created, the db will be seeded with an init script included in the project
5. to clear and reseed the data, run `docker-compose down -v` in the root directory of the project. This will remove the volume and the data it contains. Then run `docker-compose up` again to recreate the volume and seed the db again.

