## Description
This is a straightforward implementation of a CRUD API server. It utilizes an in-memory data storage managed by a worker, simulating the functionality of a real database. Additionally, the server includes a load balancer for horizontal scaling, allowing for efficient distribution of incoming requests.

## Installation

**Before you begin, ensure that you have installed **Node.js(v18 LTS)***

### To install the project locally, follow these steps:

1. Clone the repository:

```
git clone git@github.com:oryngalikarimzhan/simple-crud-api.git
```

2. Change directory into the project root:

```
cd simple-crud-api
```

3. Change branch:

```
git checkout develop
```

5. Install dependencies:

```
npm i
```

## Usage

The following commands are available:

To start the server in 'development' mode

```
npm run start:dev
```

To start the server in 'production' mode

```
npm run start:prod
```

To start the server in 'development' mode with 'clustering' ability
```
npm run start:multi:dev
```

To start the server in 'production' mode with 'clustering' ability

```
npm run start:multi:prod
```

To run tests you need to start server in 'development' mode with command above and open new terminal window and run this command

```
npm run test
```
