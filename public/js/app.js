
// var url = "https://twitterprofile.herokuapp.com";
var url = "http://localhost:5000";
var socket = io(url);

socket.on('connect', function () {
    console.log("connected")
});

function signup() {

    axios({
        method: 'post',
        url: url + '/auth/signup',
        data: {
            name: document.getElementById("txt_name").value,
            email: document.getElementById("txt_email").value,
            password: document.getElementById("txt_password").value,
            phone: document.getElementById("txt_number").value,
            gender: document.getElementById("gender").value
        }, withCredentials: true
    }).then((response) => {
        if (response.data.status === 200) {
            alert(response.data.message)
            location.href = "./../login.html"
        } else {
            alert(response.data.message);
        }
    }).catch((error) => {
        console.log(error);
    });

    return false;
}

function login() {
    axios({
        method: 'post',
        url: url + "/auth/login",
        data: {
            email: document.getElementById("txt_email").value,
            password: document.getElementById("txt_password").value,
        },
        withCredentials: true
    }).then((response) => {
        if (response.data.status === 200) {
            sessionStorage.setItem("email", document.getElementById("txt_email").value)
            console.log(response.data.message);
            alert(response.data.message);
            window.location.href = "./../home.html"
            return
        } else {
            alert(response.data.message)
        }
    }, (error) => {
        console.log(error);
    });

    return false;
}
function getProfile() {
    axios({
        method: 'get',
        url: url + '/profile',
        credentials: 'include',
    }).then((response) => {
        let src = response.data.profile.profilePic
        let name = response.data.profile.name;
        name = name.charAt(0).toUpperCase() + name.slice(1);
        document.getElementById('name').innerHTML = name
        if (src) {
            document.getElementById('profilePic').style.backgroundImage = `url(${src})`;
            document.getElementById('createPostImg').src = src;
        }
        else {
            document.getElementById('createPostImg').style.backgroundImage = `url(${'./../images/fallback.jpg'})`;
            document.getElementById('profilePic').src = './../images/fallback.jpg';
        }
        sessionStorage.setItem('email', response.data.profile.email)
    }, (error) => {
        location.href = "../login.html"
    });
    return false
}



function upload() {

    var fileInput = document.getElementById("fileInput");

    // // To convert a File into Blob (not recommended)
    // var blob = null;
    // var file = fileInput.files[0];
    // let reader = new FileReader();
    // reader.readAsArrayBuffer(file)
    // reader.onload = function (e) {
    //     blob = new Blob([new Uint8Array(e.target.result)], { type: file.type });
    //     console.log(blob);
    // }

    console.log("fileInput: ", fileInput);
    console.log("fileInput: ", fileInput.files[0]);

    let formData = new FormData();
    // https://developer.mozilla.org/en-US/docs/Web/API/FormData/append#syntax

    formData.append("myFile", fileInput.files[0]); // file input is for browser only, use fs to read file in nodejs client
    // formData.append("myFile", blob, "myFileNameAbc"); // you can also send file in Blob form (but you really dont need to covert a File into blob since it is Actually same, Blob is just a new implementation and nothing else, and most of the time (as of january 2021) when someone function says I accept Blob it means File or Blob) see: https://stackoverflow.com/questions/33855167/convert-data-file-to-blob
    formData.append("email", sessionStorage.getItem("email")); // this is how you add some text data along with file
    formData.append("myDetails",
        JSON.stringify({
            "subject": "Science",   // this is how you send a json object along with file, you need to stringify (ofcourse you need to parse it back to JSON on server) your json Object since append method only allows either USVString or Blob(File is subclass of blob so File is also allowed)
            "year": "2021"
        })
    );

    // you may use any other library to send from-data request to server, I used axios for no specific reason, I used it just because I'm using it these days, earlier I was using npm request module but last week it get fully depricated, such a bad news.
    axios({
        method: 'post',
        url: url + "/upload",
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
    })
        .then(res => {
            console.log(`  upload Success`);
            alert("upload Success")
            // document.getElementById("show_pic").innerHTML = instanceOfFileReader.readAsDataURL(res.data);


        })
        .catch(err => {
            console.log(err);
        })

    return false; // dont get confused with return false, it is there to prevent html page to reload/default behaviour, and this have nothing to do with actual file upload process but if you remove it page will reload on submit -->

}

function tweetpost() {
    axios({
        method: 'post',
        url: url + "/tweet",
        data: {
            tweet: document.getElementById("tweet").value,
        },
        withCredentials: true
    }).then((response) => {

        console.log(response.data.data.username);
        document.getElementById('mytweet').innerHTML += `
        <div>
        <img src="${response.data.data.profilePic}" id="show_pic"  />
        <h4>${response.data.data.username}</h4>
        <p>${response.data.data.tweet}</p>
        </div>
        
        `

    }, (error) => {
        console.log(error);
    });
    document.getElementById('tweet').value = "";
    return false;
}

function gettweet() {
    axios({
        method: 'get',
        url: url + '/tweet-get',
        credentials: 'include',
    }).then((response) => {
        let tweets = response.data;
        let html = ""
        tweets.forEach(element => {
            html += `
            <div>
            <h4>${element.username}</h4>
            <p>${element.tweet}</p>
            </div>
            `
        });
        document.getElementById('getall').innerHTML = html;

        let userTweet = response.data
        let userHtml = ""

        userTweet.forEach(element => {
            if (element.username == response.data.username) {
                userHtml += `
                <div>
                <h4>${element.usernmae}</h4>
                <p>${element.tweet}</p>
                </div>
                `
            }
        });
        document.getElementById('mytweet').innerHTML = userHtml;
    }, (error) => {
        console.log(error.message);
    });

    return false

}

socket.on('NEW_POST', (newPost) => {
    console.log(newPost)
    let tweets = newPost;
    document.getElementById('getall').innerHTML += `
    <div>
    <h4>${tweets.username}</h4>
    <p>${tweets.tweet}</p>
    </div>
    `
})


function previewFile() {
    const preview = document.querySelector('img');
    const file = document.querySelector('input[type=file]').files[0];
    const reader = new FileReader();

    reader.addEventListener("load", function () {
        // convert image file to base64 string
        preview.src = reader.result;
    }, false);

    if (file) {
        reader.readAsDataURL(file);
    }
}





function forget() {
    axios({
        method: 'post',
        url: url + "/forget-password",
        data: {
            email: document.getElementById("txt_email").value,
        },
        withCredentials: true
    }).then((response) => {
        if (response.data.status === 200) {
            console.log(response.data.message);
            alert(response.data.message);
            window.location.href = "./../forget-two.html"
            return
        } else {
            alert(response.data.message)
        }
    }, (error) => {
        console.log(error);
    });

    return false;

}
function ChangePassowd() {
    axios({
        method: 'post',
        url: url + "/forget-password-step2",
        data: {
            email: document.getElementById("txt_email").value,
            otp: document.getElementById("txt_otp").value,
            newPassword: document.getElementById("txt_password").value,
        },
        withCredentials: true
    }).then((response) => {
        if (response.data.status === 200) {
            console.log(response.data.message);
            alert(response.data.message);
            window.location.href = "./../login.html"
            return
        } else {
            alert(response.data.message)
        }
    }, (error) => {
        console.log(error);
    });
    return false;

}


function logout() {
    axios({
        method: 'post',
        url: url + '/logout',
        credentials: 'include',
    }).then((response) => {
        console.log(response);
        window.location.href = "./../login.html"
    }, (error) => {
        console.log(error.message);
    });
    return false
}
