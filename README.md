# Node.js Hello World API

Esta é uma aplicação simples em Node.js usando Express. Ela fornece duas rotas:

- `GET /hello` - Retorna uma mensagem "Hello, World!".
- `GET /health` - Retorna o status de saúde da aplicação.

## Requisitos

- Node.js instalado (versão 14 ou superior)
- npm instalado
- Docker (opcional, caso queira executar via contêiner)

## Instalação

1. Clone este repositório:
   ```sh
   git clone https://github.com/tiagohique/api-node.git
   cd api-node
   ```

2. Instale as dependências:
   ```sh
   npm install
   ```

## Executando a aplicação

### Usando Node.js diretamente
Para iniciar o servidor, execute:

```sh
node index.js
```

O servidor será iniciado e estará disponível em `http://localhost:3000`.

### Usando Docker

1. Construa a imagem Docker:
   ```sh
   docker build -t node-hello-api .
   ```

2. Execute o contêiner:
   ```sh
   docker run -p 3000:3000 node-hello-api
   ```

3. Para rodar em modo interativo e acompanhar os logs:
   ```sh
   docker run -p 3000:3000 -it node-hello-api
   ```

4. Para rodar o contêiner em background (modo daemon):
   ```sh
   docker run -d -p 3000:3000 node-hello-api
   ```

5. Para visualizar os logs do contêiner em execução:
   ```sh
   docker logs -f <container_id>
   ```

6. Para parar e remover o contêiner:
   ```sh
   docker ps  # Listar containers ativos
   docker stop <container_id>
   docker rm <container_id>
   ```

## Testando as rotas

Use o navegador ou ferramentas como `curl` ou Postman para acessar as rotas:

```sh
curl http://localhost:3000/hello
curl http://localhost:3000/health
```

## Autor

Desenvolvido por tiagohique.
