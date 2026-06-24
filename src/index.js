import express from "express";
const app = express();

app.use(express.json());

const port = 8080;

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
