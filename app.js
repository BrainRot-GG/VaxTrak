const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const googleAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = googleAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });
const express=require('express')
const app=express()
const path=require('path')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const cookieParser=require('cookie-parser')
app.use(cookieParser())
const db=require("./config/mongoose-connection")
const userModel=require("./models/user-model.js")
const memberModel=require("./models/member-model.js")
const hospitalModel=require("./models/hospital-model.js")
const vacModel=require("./models/vaccine_collection-model.js")
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // ensure the folder exists
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const fileFilter = function (req, file, cb) {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
};

const upload = multer({ storage, fileFilter });

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,"public")))
app.use("/uploads", express.static("uploads"));

const session = require('express-session');

app.use(session({
    secret: "Keepmeloggedin247",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true only with HTTPS
      maxAge: 1000 * 60 * 60 * 24
    }
  }));


app.get("/",(req,res)=>{
    res.render("animate")
})

app.get("/register",(req,res)=>{
    res.render("register_user")
})
app.get("/homepage2",(req,res)=>{
    res.render("homepage2")
})
app.get("/get_certificate",async(req,res)=>{
    const extract_member = await memberModel.find({ user: req.session.userId });
    const vaccines = await vacModel.find();
    const recommendedMap = extract_member.map(member => {
        const filtered = vaccines.filter(v => member.age >= v.minAge && member.age <= v.maxAge);
        return filtered.map(v => v.name);
    });
    res.render("get_certificate",{ extract_member,recommendedMap})
})
app.get("/homepage",(req,res)=>{
    res.render("homepage")
})

app.get("/hospital", async (req, res) => {
    let selectedVaccines = req.query.vaccines;

    // If only one vaccine is selected, req.query.vaccines will be a string
    if (!Array.isArray(selectedVaccines)) {
        selectedVaccines = [selectedVaccines];
    }

    const allHospitals = await hospitalModel.find();

    const paidHospitals = allHospitals.filter(h =>
        h.hos_category === "Paid" &&
        h.Vaccine_available.some(v => selectedVaccines.includes(v))
    );
    const freeHospitals = allHospitals.filter(h =>
        h.hos_category === "Free" &&
        h.Vaccine_available.some(v => selectedVaccines.includes(v))
    );

    res.render("hospitals", { paidHospitals, freeHospitals });
});


app.get("/track", async (req, res) => {
    if (!req.session.userId) return res.redirect("register");

    const extract_member = await memberModel.find({ user: req.session.userId });
    const vaccines = await vacModel.find();
    const recommendedMap = extract_member.map(member => {
        const filtered = vaccines.filter(v => member.age >= v.minAge && member.age <= v.maxAge);
        return filtered.map(v => v.name);
    });
    res.render("track_status", { extract_member,recommendedMap});
});

app.get("/add_member",async(req,res)=>{
    res.render("add_member")
})


app.get("/login",async(req,res)=>{
    res.render("login")
})
app.get("/add_hospital",(req,res)=>{
    res.render("add_hospital")
})
app.get("/developer",(req,res)=>{
    res.render("developer")
})
app.post("/register_user",async(req,res)=>{
    let{email,phone,password,confirm_password}=req.body
    bcrypt.genSalt(10,(err,Salt)=>{
        bcrypt.hash(password,Salt,async(err,hash)=>{
            let new_user=await userModel.create({
                        email,
                        phone,
                        password:hash,
                        confirm_password:hash
                    })
            let token=jwt.sign({email},"store")
            res.cookie("token",token)
            res.redirect("interface")
        })
    })
})
function isLogged(req,res,next){
    if(req.cookies.token === ""){
        res.status(400).send("You need to login")
    }
    else{
        
        let data=jwt.verify(req.cookies.token,"pause")
        req.user = data
        next();
    }
}


app.post("/added_members", async (req, res) => {
    let { name, age, gender, building, street, city, state, pincode, vaccines } = req.body;
    if (!vaccines) vaccines = [];
    else if (!Array.isArray(vaccines)) vaccines = [vaccines];
    await memberModel.create({
        name,
        age,
        gender,
        building,
        street,
        city,
        state,
        pincode,
        vaccines_taken: vaccines,
        user: req.session.userId //link member to logged-in user
    });
    res.redirect("register")
});

app.post("/upload-document/:memberId", upload.single("pdf"), async (req, res) => {
    const memberId = req.params.memberId;

    if (!req.file) {
        return res.status(400).send("No file uploaded or not a PDF.");
    }

    const documentPath = "/uploads/" + req.file.filename;

    try {
        await memberModel.findByIdAndUpdate(memberId, { document: documentPath });
        res.redirect("/interface");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error uploading document");
    }
});


app.post("/login_user", async (req, res) => {
    const check_user = await userModel.findOne({ email: req.body.email });
    bcrypt.compare(req.body.password, check_user.password, (err, result) => {
        if (err) {
            return res.status(500).send("Error during password check");
        }
        if (result) {
            req.session.userId = check_user._id;
            return res.redirect("homepage2");
        } else {
            return res.send("Incorrect password");
        }
    });
    
});


app.get("/logout",async(req,res)=>{
    res.cookie("token","")
    res.redirect("register")
})


app.get("/interface", async (req, res) => {
    //if (!req.session.userId) return res.redirect("/login");

    const extract_member = await memberModel.find({ user: req.session.userId });
    const allHospitals = await hospitalModel.find();
    const paidHospitals = allHospitals.filter(h => h.hos_category === "Paid");
    const freeHospitals = allHospitals.filter(h => h.hos_category === "Free");
    const vaccines = await vacModel.find(); // contains name, minAge, maxAge

    const availableVaccines = vaccines.map(v => v.name);

    const recommendedMap = extract_member.map(member => {
        const filtered = vaccines.filter(v => member.age >= v.minAge && member.age <= v.maxAge);
        return filtered.map(v => v.name);
    });

    res.render("interface", {
        extract_member,
        paidHospitals,
        freeHospitals,
        recommendedMap,
        availableVaccines
    });
});
//hospitals-site-to-add-their-respective-hospital
app.post("/added_hospital",async(req,res)=>{
    let {hos_name,hos_email,hos_phone,hos_category,hos_vaccines,address_1,street,city,state,pincode}=req.body;``
    if (!hos_vaccines) {
        hos_vaccines = [];
      } else if (!Array.isArray(hos_vaccines)) {
        hos_vaccines = [hos_vaccines];
      }
      
    let hospitals=await hospitalModel.create({
        hos_name,
        hos_email,
        hos_phone,
        hos_category,
        Vaccine_available : hos_vaccines,
        address_1,
        street,
        city,
        state,
        pincode
    })
    res.send(hospitals)
})
//developers-site-to-add-vaccine
app.post("/add_vaccines", async (req, res) => {
    try {
        let { vaccines } = req.body; 
        if (!Array.isArray(vaccines)) return res.status(400).send("Invalid format");

        await vacModel.insertMany(vaccines);
        res.status(201).send("Vaccines added");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to add vaccines");
    }
});

//gemini
app.post("/gemini_health_query", async (req, res) => {
    function isValidHealthcareQuery(input) {
        const keywords = [
            "vaccine", "vaccination", "immunization", "dose", "hospital",
            "side effects", "healthcare", "medicine", "disease", "covid",
            "booster", "appointment", "doctor", "clinic", "injection"
        ];
        const lowerInput = input.toLowerCase();
        return keywords.some(keyword => lowerInput.includes(keyword));
    }

    const userInput = req.body.prompt;

    if (!userInput || typeof userInput !== "string") {
        return res.status(400).json({ error: "Invalid or missing prompt." });
    }

    if (!isValidHealthcareQuery(userInput)) {
        return res.status(400).json({
            error: "This assistant only handles healthcare and vaccine-related queries."
        });
    }

    try {
        const instruction = `Respond briefly in 1-2 lines. Only provide a detailed answer if the user asks for more details.`;
        const result = await model.generateContent(instruction + "\n" + userInput);
        const response = await result.response.text();
        res.json({ response });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error generating response from Gemini." });
    }
});



app.listen(3000)

