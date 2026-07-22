import { createServer } from "./platform/http/server";

const app = createServer();

// auth.api.createUser({
//   body: {
//     email: "admin@admin.com",
//     password: "123456",
//     name: "Admin",
//     role: "admin",
//   },
// });

export default app;
