# Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd backend-teststk
```

2. **Install dependencies**

This project uses **pnpm** as the package manager.

```bash
pnpm install
```

3. **Setup environment variables**

Copy the example environment file:

```bash
cp .env.example .env
```

Then update the environment variables if needed to match your local database configuration.

4. **Run database migrations**

Run the migration command to create the required database tables.

```bash
pnpm migration:run
```

Make sure your database server is running and the environment variables are configured correctly before executing this command.

---

# How to Run in Development Mode

Start the development server:

```bash
pnpm start:dev
```

The application will run at:

```
http://localhost:3000
```

Development mode provides:

* Automatic server reload when files change
* Detailed error messages
* Easier debugging during development

---

# How to Run in Production Mode

1. **Build the application**

```bash
pnpm build
```

2. **Start the production server**

```bash
pnpm start:prod
```

The optimized production build will run at:

```
http://localhost:3000
```

Production mode runs the compiled JavaScript from the `dist` directory for better performance and stability.

---

# API Documentation

## Get All Menus (Tree Structure)

**GET** `/menus`

Returns the hierarchical menu structure.

Example response:

```
[
  {
    "id": 1,
    "title": "Dashboard",
    "parent_id": null,
    "order_index": 1,
    "children": []
  },
  {
    "id": 2,
    "title": "Settings",
    "parent_id": null,
    "order_index": 1,
    "children": [
      {
        "id": 3,
        "title": "Users",
        "parent_id": 2,
        "order_index": 1,
        "children": []
      }
    ]
  }
]
```

---

## Create Menu

**POST** `/menus`

Request body:

```
{
  "title": "Dashboard",
  "parent_id": null
}
```

Description:

Creates a new menu. If `parent_id` is provided, the menu will be created as a child of the specified parent.

---

## Update Menu

**PATCH** `/menus/:id`

Request body:

```
{
  "title": "New Menu Name"
}
```

Description:

Updates the menu title or other editable fields.

---

## Delete Menu

**DELETE** `/menus/:id`

Description:

Deletes the specified menu.

Menu ordering will be normalized after deletion to keep order indexes consistent.

---

## Move Menu

**PATCH** `/menus/:id/move`

Request body:

```
{
  "new_parent_id": 2
}
```

Description:

Moves the menu to a new parent.

The system validates:

* Parent existence
* Prevention of circular references
* Unique menu titles within the same parent

---

## Reorder Menu

**PATCH** `/menus/:id/reorder`

Request body:

```
{
  "new_order_index": 2
}
```

Description:

Changes the position of the menu within the same parent.

The system ensures that ordering remains consistent and prevents duplicate order indexes.

---

# Technology Choices and Architecture Decisions

## Technology Choices

**NestJS**

NestJS is used as the primary backend framework because it provides a well-structured architecture with strong support for dependency injection and modular development.

Although I am relatively new to both **NestJS** and **Go**, I chose NestJS for this project because it is built on top of **JavaScript / TypeScript**, which aligns better with my existing experience. This allows me to focus more on implementing the required system logic rather than learning a completely new language ecosystem.

---

**TypeORM**

TypeORM is used as the ORM to simplify database interactions by mapping database tables to TypeScript entities and providing built-in support for transactions and migrations.

---

**MySQL**

MySQL is used as the relational database because it provides strong consistency, reliable transaction support, and is widely used in production systems.

---

**pnpm**

pnpm is used as the package manager because it provides faster installation and more efficient disk usage compared to traditional package managers.

---

## Architecture Decisions

The project follows a **modular and layered architecture** to maintain clear separation of concerns.

**Controller Layer**

Handles incoming HTTP requests and sends responses back to the client.

---

**Service Layer**

Contains the main business logic and coordinates operations such as menu creation, movement, and reordering.

---

**Validator Layer**

Handles business rule validation including:

* Parent existence validation
* Unique title validation within the same parent
* Circular reference prevention
* Order index validation

Separating validation logic from the service layer helps keep services clean and easier to maintain.

---

**Utility Layer**

Reusable logic such as menu ordering operations, transaction helpers, and database error handling are placed inside the `common/utils` directory to avoid duplication and improve maintainability.

---

This layered approach helps the system remain:

* scalable
* maintainable
* easier to extend as new features are added
