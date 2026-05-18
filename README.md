# FixMate.lk - Final Year Project (Service Management System)

Hey everyone! Welcome to our group’s final year software engineering project repository.

FixMate.lk is a full-stack web application we are building to handle service management. We are using **React (powered by Vite)** for the frontend and **Node.js + Express** for the backend API.

---

## Meet the Team

| Name     | Role           |
| -------- | -------------- |
| Sanjeewa | Full Stack Dev |
| Vihas    | Backend Dev    |
| Tharindu | Backend Dev    |
| Sewmini  | Frontend Dev   |
| Imesh    | Frontend Dev   |

---

## Project Structure

We split the project into two main folders so things don't get messy:

```text
service-management-system/
├── client/       # React Frontend (Vite)
├── server/       # Node.js + Express Backend
├── .gitignore    # Keeps node_modules and .env out of GitHub
└── README.md     # Project documentation
```

---

# How to Run This Project Locally

You will need two terminal windows open to run this project — one for the frontend and one for the backend.

---

## Frontend Setup (React + Vite)

```bash
cd client
npm install
npm run dev
```

- `npm install` → Run this first time only to install node_modules
- `npm run dev` → Starts the Vite development server

---

## Backend Setup (Node.js + Express)

Before running the backend, make sure you create a `.env` file inside the `server/` folder.

Ask the backend team members for the required environment variables.

```bash
cd server
npm install
node index.js
```

---

# Important Notes

### Use `.gitignore`

Do not upload:

- `node_modules`
- `.env`
- other unnecessary files

`.gitignore` is already added for that.

---

### Use `.env` Files

Keep secret keys, database URLs, API keys, and sensitive data inside `.env` files.

Never push `.env` files to GitHub.

---

### We Are Using Vite

Frontend is created using **Vite** instead of Create React App for faster development and better performance.

---

# Git Rules (PLEASE READ)

To avoid merge conflicts and breaking the main project:

## DO NOT PUSH DIRECTLY TO MAIN

Each team member must create their own branch before starting development.

Push code only to your own branch.

---

## Push Your Branch Like This

```bash
git add .
git commit -m "Add login page"
git push origin your-branch-name
```

Example:

```bash
git push origin sanjeewa-auth
```

---

Happy coding everyone
Let’s finish this final year project successfully
