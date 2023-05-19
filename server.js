import { MongoClient, ObjectId } from 'mongodb'
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import bcrypt from 'bcrypt';

const app = express();
const port = 3004;
const FIVE_MINUTES = 5 * 60 * 1000; 
const saltRounds = 10;

const client = new MongoClient('mongodb://127.0.0.1:27017');
await client.connect();
const db = client.db('bank');
const accountCollection = db.collection('accounts');
const dbLogin = client.db('loginproject');
const userCollection = dbLogin.collection('users');

app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.urlencoded());
app.use(session({
    resave:false,
    saveUninitalialized: false,
    secret: 'Shhh',
    cookies:{
        maxAge:  FIVE_MINUTES
    }
}));

//////////////////  Autentisering  ////////////////////

app.post('/api/register', async (req, res)=>{
    const allUserNames = await userCollection.find({}).toArray();
    const result = allUserNames.filter(user=> req.body.user === user.user);

    if(result.length === 0){
        const hashPass = await bcrypt.hash(req.body.pass, saltRounds);
        const post = {
            user: req.body.user, 
            pass: hashPass,
        };
        let answer = await userCollection.insertOne(post);
        res.json({answer});
    }else{
        res.status(401).json({ error: 'Unauthorized'});
    }
})


app.post('/api/login', async (req, res)=>{
    const user = await userCollection.findOne({user: req.body.loginUser});
    
    if(user){
        const match = await bcrypt.compare(req.body.loginPass, user.pass); 
        
        console.log("match:", user.pass);
        if(match){
            req.session.user = user;
            res.json({user: user.user});
            //console.log(user.user);
        }else{
            res.status(401).json({ error: 'Unauthorized'});         
        }
    }
});     

app.get('/api/loggedin', (req, res)=>{ 
    if(req.session.user){
        res.json({user: req.session.user});
    }else{
        res.status(401).json({ error: 'Unauthorized'});
    }
});

app.post('/api/logout', (req,res)=>{
    req.session.destroy(()=>{
        res.json({
            loggedin:false
        });
    });
});

//////////////////  Banken  ////////////////////

//Hämtar alla konton
app.get('/api/bank', async(req, res)=>{
    const answer = await accountCollection.find({}).toArray();
    res.json({accounts: answer});
});

//Hämta ett konto
app.get('/api/bank/:id', async(req, res)=>{
    const answer = await accountCollection.findOne({_id: new ObjectId(req.params.id)});
    res.json({accounts: answer});
});

//Skapa nytt konto. 
app.post('/api/bank', async ( req, res)=>{
    const post = {
        accountName: req.body.name, 
        balance: req.body.balance,
        registered: new Date(),
    };
    let answer = await accountCollection.insertOne(post);
    res.json({answer});
});

//uppdatera ett konto
app.put('/api/bank/:id', async(req, res)=>{
    const temp = new ObjectId(req.params.id);
    const balanceBefore = await accountCollection.findOne({_id: temp});
    let balanceAfter 
    if(req.body.select === 'add'){
        balanceAfter = parseInt(balanceBefore.balance) + parseInt(req.body.sum);

    } else{
        balanceAfter = parseInt(balanceBefore.balance) - parseInt(req.body.sum);
    };

    const post = {balance: balanceAfter};
    await accountCollection.updateOne({_id: temp}, { $set: post});
    const updatedBalance = await accountCollection.findOne({_id:temp });
    res.json({updatedBalance});
})

//Tar bort ett konto
app.delete('/api/bank/:id', async(req, res)=>{
    const deleted = await accountCollection.deleteOne({_id: new ObjectId(req.params.id)});
    res.json({deleted});
})



//lyssnar på hemsidan.
app.listen(port, ()=>{
    console.log( 'app listening to port', port)
});
