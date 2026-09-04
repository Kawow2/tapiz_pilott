## Prerequisites

- Docker installed on your system.

## Installation & Configuration

Follow these steps to set up Tapiz using Docker:

1. **Copy the Example Environment File**  
   Create a copy of the example environment file `.env.example` and name it `.env`:

   ```bash
   cp .env.example .env
   ```

2. **Use the Default Environment Variables (Optional)**  
   The default settings in the `.env` file are suitable for local development using Docker. Specifically, the default PostgreSQL credentials are:

   - **Database User**: `tapiz_user`
   - **Database Password**: `tapiz_password`

   These defaults can be used in a local development environment, but **it is strongly recommended to change them** before deploying to production.

3. **Authentication**  
   Tapiz does not require any external authentication provider. Users simply
   enter a nickname on the login screen to start using the app; each nickname
   creates a lightweight anonymous account and session.

4. **Build and Run the Docker Containers**  
   After configuring your environment variables, build and start the Docker containers by running:

   ```bash
   docker-compose up -d
   ```

5. **Access the Application**  
   Your Tapiz application will be available at [http://localhost:4300](http://localhost:4300).
