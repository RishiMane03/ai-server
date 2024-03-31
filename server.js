const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
require("dotenv").config();
const clc = require("cli-color");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const jwt_decode = require('jwt-decode');

const OpenAI= require('openai')

const openai = new OpenAI({
    apiKey: `${process.env.OPENAI_API_KEY}`,
})



//file-import
const { userDataValidation } = require("./utils/authUtils");
const userModel = require('./models/userModel');
const saveChatModel = require('./models/saveChatModel');
const { genrateJWTToken } = require('./utils/tokenUtils');
const summarizeParagraph = require('./utils/summaryUtils');
const solution = require('./utils/codeUtils');
const questions = require('./utils/questionsUtils');
const pdfDoubt = require('./utils/pdfDoubt');
const isAuth = require('./utils/isAuth');


// Variables
const app = express();
const PORT = process.env.PORT || 7000;


// Middleware
app.use(cors({
    origin : [`${process.env.BACKEND_URL}`],
    credentials : true
}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); //this is used for form data
app.use(express.json()); // this is used for hitting req from anywhere like postman and converting client data to json
app.use(cookieParser());


// Databse Connection
mongoose.connect(process.env.URI)
 .then(() => console.log(clc.white.bgGreen.underline("Connected to Database")))
 .catch((err) => console.log(clc.bgRed(err)));



app.get('/', function (req, res) {
  res.send('Welcome to the world of ai')
})

app.post('/register', async(req, res)=>{
    // console.log('req.body is >> ',req.body);
    const { name, email, username, password } = req.body;

    // Data validation
    try {
        await userDataValidation(name, email, username, password);
    } catch (error) {
        return res.send({
        status: 400,
        message: "Data error",
        error: error,
        });
    }

    //check if email and username already exist or not
    const usernameAlreadyExist = await userModel.findOne({username})
    if(usernameAlreadyExist){
        return res.send({
            status: 400,
            message: "Username already exists",
            alreadyUser: true
        });
    }

    const emailAlreadyExist = await userModel.findOne({email})
    if(emailAlreadyExist){
        return res.send({
            status: 400,
            message: "Email already exists",
            alreadyEmail: true
        });
    }

    // Bcrypt the password
    const hashedPassword = await bcrypt.hash(
        password,
        parseInt(process.env.SALT)
    );

    // Storing data in DB
    const userData = userModel({
        name: name,
        email: email,
        username: username,
        password: hashedPassword,
    })

    try {
        const userDb = await userData.save();
        return res.send({
          status: 201,
          message: "Registeration successfull",
          data: userDb,
        });
    } catch (error) {
        return res.send({
          status: 500,
          message: "Database error",
          error: error,
        });
    }
})

app.post('/signIn', async (req, res) => {
    const { name, password } = req.body;

    // find user in database
    try {
         let userDb = await userModel.findOne({ username: name });

        console.log('userDb > ',userDb);
        // no user found
        if(!userDb) {
            console.log('userDb inside > ',userDb);
            return res.send({
                status: 400,
                message: "User not found, please register",
                noUser : true
            });
        }

        // hash password verify
        const isMatched = await bcrypt.compare(password, userDb.password); //it will return true/false 

        if(!isMatched) {
            return res.send({
                status: 400,
                message: "Password does not match",
                wrongPassword: true
            });
        }

        const accessToken = jwt.sign({ name: name }, process.env.SECRET_KEY, {
            expiresIn: '10m' //expiry time  
        });
          
        //cookie with expiry of 10 minutes
        res.cookie('accessToken', accessToken, { maxAge: 600000 }); 

        // find the userData from database
        const userDataObj = await userModel.find({ name })

        return res.send({
            status: 200,
            message: "Login successful",
            loginSuccessful : true ,
            userDataObj : userDataObj
        })

    } catch (error) {
        return res.send({
            status: 500,
            message: "Database error",
            error: error,
            dataBaseError : true
        })
    }

})

app.get('/logout', (req, res) => {
    res.clearCookie('accessToken'); // Set the path explicitly
    res.send({
        status: 200,
        message: 'Logout successful',
        logout: true
    });
});

// DashBoard
app.get('/dashboards', isAuth, async (req, res) => {
    console.log('dashboard api started')
    res.send({
        tokenVerify : true
    })
});

// Summary
app.post('/summarize', isAuth, async (req, res) => {
    console.log('summary api started')

    const { paragraph } = req.body;
    // console.log(paragraph);
    
    try {
        const summary = await summarizeParagraph(paragraph);
        res.send({ summary , tokenVerify : true });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error'});
    }
});

// code
app.post('/getCode', isAuth, async (req, res) => {
    console.log('code api running')
    const { language,inputedCode } = req.body;
    console.log(language,inputedCode);
    
    try {
        const codeSolution = await solution(language,inputedCode);
        res.send({ codeSolution });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// chat
app.post('/saveChat', async (req,res)=>{
    try {
        const { allMessages, userIdToken } = req.body;
        // console.log('userIdToken > ', userIdToken);

        // jwt.verify(userIdToken, process.env.SECRET_KEY, async (err, decoded) => {
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         req.name = decoded.name; // 'name' is stored in the token
        //         const userName = decoded.name; // Extracting 'name' from the decoded token payload
        //         console.log('userName:', userName);

        //         // Save all messages to MongoDB
        //         await saveChatModel.insertMany(allMessages.map(message => ({ ...message, userName })), { ordered: false });
        //         res.status(200).send({ message: 'Messages saved successfully' });
        //     }
        // });


        // Save all messages to MongoDB
        await saveChatModel.insertMany(allMessages, { ordered: false }); //We use insertMany() to save all messages to the database. The { ordered: false } option tells MongoDB to continue inserting documents even if errors occur, allowing us to ignore duplicates.
        res.status(200).send({ message: 'Messages saved successfully' });

        
    } 
    catch (error) {
        /*
            In MongoDB, when you attempt to insert a document with a field value that 
            violates a unique index constraint, MongoDB will throw a duplicate key error. 
            This error has a specific error code associated with it, which is 11000. 
        */
            if (error.code === 11000) {
                console.error('Duplicate message detected:', error);
                res.status(400).send({ error: 'Duplicate message' });
            } else {
                console.error('Error saving messages:', error);
                res.status(500).send({ error: 'Internal server error' });
            }
    }
})

// chat : previous chats
app.get('/getAllChats', async (req, res) => {
    try {
        const allChats = await saveChatModel.find();
        res.status(200).send(allChats);
    } catch (error) {
        console.error('Error fetching all chats:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// PDF
// PDF : getSummary
app.post('/pdfSummary', async (req, res) => {
    const { pdfContent } = req.body;
    // console.log(paragraph);
    
    try {
        const summary = await summarizeParagraph(pdfContent);
        res.send({ summary });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PDF : getQuestions
app.post('/pdfQuestions', async(req,res) =>{
    const { pdfContent } = req.body;
    try {
        const allQuestions = await questions(pdfContent);
        res.send({ allQuestions });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// PDF askDoubt
app.post('/askDoubt', async(req,res) =>{
    console.log('im inside ask doubt');
    const { pdfContent } = req.body;
    const { question } = req.body;
    try {
        const ansToDoubt = await pdfDoubt(pdfContent,question);
        res.send({ ansToDoubt });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// IMAGE
app.post('/genImg', async(req,res)=>{
    const {  prompt } = req.body
    console.log('prompt is : ',prompt);

    const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
    });

    // image_url = response.data.data[0].url;
    console.log(response.data[0].url);


    res.send({
        myPromt : prompt,
        aiImageURL : response.data[0].url
    })
})

app.listen(PORT,()=>{
    console.log(clc.white.bgGreen.underline(`Server running on port ${PORT}`));
})

