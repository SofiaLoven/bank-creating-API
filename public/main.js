
///// Autentisering /////
const loginForm = document.querySelector("#login");
const user = document.querySelector("#user");
const pass = document.querySelector("#pass");
const welcome = document.querySelector("#welcome");
const regForm = document.querySelector("#register");
const regUser = document.querySelector("#regUser");
const regPass = document.querySelector("#regPass");
const regMess = document.querySelector("#regMess");
const logout = document.querySelector("#logout");
const bankPage = document.querySelector("#signedIn");
const authDiv = document.querySelector("#signedOut");


let renderPage = async () =>{
    let response = await fetch('/api/loggedin');
    let data = await response.json();
    //console.log(data)
    if(data.user){
        welcome.innerText = `You have signed in as ${data.user.user}!`;
        authDiv.classList.add("hidden");
        logout.classList.remove("hidden");
        bankPage.classList.remove("hidden");
        getAccounts(); 
    } else{
        console.log('Load Page:', data.error);
        bankPage.classList.add("hidden");
    }
}


regForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    let response = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            user: regUser.value,
            pass: regPass.value
        })
    })
    let result = await response.json();
    console.log(response);
    if(response.ok){
        regMess.innerText= `Tack för att du har registrerat dig. Nu kan ${regUser.value} logga in.`;
        regUser.value ="";
        regPass.value="";
    }else{
        alert('Ditt användarnamn är redan upptaget. Försök med ett nytt');
        console.log('Error:', result);
    }
})

loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    let response = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            loginUser: user.value,
            loginPass: pass.value
        })
    })
    let result = await response.json();
    console.log(response);
    if(response.ok){
        console.log('login:', result);
        location.reload();
    }else{
        alert("Du har tyvärr fel användarnamn eller lösenord");
    }
    
})

logout.addEventListener('submit', async (e)=>{
    e.preventDefault();
    let response = await fetch('/api/logout',{
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    });
    let reply = await response.json();
    console.log('logput:', reply)
    location.reload();
})

///// Bankkonton /////

//Hämtar alla konton
let getAccounts = async ()=>{
    try{
        let response = await fetch('/api/bank');
        let data = await response.json();

        renderAccounts(data.accounts);
    }catch(error){
        console.log('Cant get accounts', error);
    }
}

let accountList = document.querySelector('#accountList');
//Skriver ut kontona i en lista
let renderAccounts = (arr)=>{
    accountList.innerHTML = '';
    arr.forEach(obj => {
        let li = document.createElement('li');
        li.innerHTML = `
        <p>${obj.accountName}</p>
        <p>Kontonummer ${obj._id}</p>
        <p>Saldo ${obj.balance}kr</p>
        <button id="open${obj._id}"> Redigera konto </button>
        <form class='hidden' id="change${obj._id}" " data-postid="${obj._id}">
        <label>Ange summa och välj om du vill ta ut eller sätta in pengar</label></br>
        <select name="addRemove${obj._id}">
        <option value="add">Sätt in</option>
        <option value="remove">Ta ut</option>
        </select></br>
        <input type="number" id="sum${obj._id}" placeholder="kr">
        <button>Skicka</button>
        </form>
        <button id="delete${obj._id}" class="hidden"> Radera konto </button>
        `
        accountList.append(li);

        const openChangeBtn = document.querySelector(`#open${obj._id}`);
        const changeForm = document.querySelector(`#change${obj._id}`);
        const deleteBtn = document.querySelector(`#delete${obj._id}`);
        
        //Visar redigering av kontot.
        openChangeBtn.addEventListener('click', ()=>{
            changeForm.classList.remove("hidden");
            deleteBtn.classList.remove("hidden");
            openChangeBtn.classList.add("hidden");
        });

        //Ändrar saldot
        changeForm.addEventListener('submit', (e)=>{
            e.preventDefault();
            let select = document.querySelector(`select[name="addRemove${obj._id}"]`).value
            let sum = parseInt(document.querySelector(`#sum${obj._id}`).value);
            let firstBalance = parseInt(`${obj.balance}`);
            let data = {sum: sum, select: select};

            if(sum > firstBalance){
                alert('Hallå där... Så mycket pengar har du inte på kontot!')
            }else{
                changeAccount(data, obj._id);
            }
        });

        //Raderar kontot
        deleteBtn.addEventListener('click', ()=>{deleteAccount(`${obj._id}`) })
        
    });
};

const changeAccount = async(data, id)=>{
    try{
        let response = await fetch(`/api/bank/${id}`,{
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        //console.log('Success:', result);
        location.reload();
    }catch(error){
        console.log('error', error);
    }
};

const deleteAccount = async(id) =>{
    try{
        let response = await fetch(`/api/bank/${id}`,{ method: 'DELETE'});
        const result = await response.json();
        console.log('Sucess', result);
        location.reload();
    }catch(error){
        console.log('error', error);
    }
}

// Lägger till nya konton via form.
let createForm = document.querySelector("#addAccount");
let accountName = document.querySelector('#name');
let accountBalance = document.querySelector('#balance');

createForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    let data = {
        name: accountName.value,
        balance: accountBalance.value,
    }
    //console.log(data);
    addAccount(data);
    //Render site
    accountName.value ='';
    accountBalance.value ='';
})

let addAccount = async(data)=>{
    try{
        let response = await fetch('/api/bank',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        console.log('Success:', result);
        location.reload();
    }catch(error){
        console.log('error', error);
    }
};

renderPage();
