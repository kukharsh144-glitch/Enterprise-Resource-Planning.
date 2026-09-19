import connectDB from "./db/DbConnection.js";
import dotenv from "dotenv";
import { server } from "./app.js"

dotenv.config({
    path : "./.env"
});

const PORT = process.env.PORT || 7000;

connectDB()
.then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})
