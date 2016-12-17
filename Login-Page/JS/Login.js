$(document).ready(function(){
	$('.message a').click(function(){
   		$('form').animate({height: "toggle", opacity: "toggle"}, "slow");
	});
	$('#createAccountBtn').click(function(){
		createAccount();
		return false;
	});
	$('#loginBtn').click(function(){
		login();
		return false;
	});

});

function checkUsername(username){
	if (username.length < 5 || username.length >= 40) {
		setErrorText("Your username must be between 5 and 40 characters");
		errorHighlight('username');
		return false;

	}
	return true;
}
function checkPassword(password){
	if (password.length < 5 || password.length >= 40) {
		setErrorText("Your password must be between 5 and 40 characters");
		errorHighlight('password');

		return false;
	}
	if (password != $('#confirmPassword').val()){
		setErrorText("Your passwords don't match!");
		errorHighlight('password');
		$('#confirmPassword').css('border', '2px solid red');
		return false; 
	}
	return true;
}
function checkEmail(email){
	//From stackoverflow: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(email)) return true;
    else {
    	setErrorText("Please enter a valid email address");
		errorHighlight('email');
    	return false;
    }
    return true;
}
function setErrorText(str){
	$('#errorLabel').html(str);
}
function errorHighlight(id){
	if (document.getElementById(id) != null) $('#' + id).css("border","2px solid red");
	$('#username, #password, #confirmPassword, #email').each(function(index){
		if (this.id != id) $(this).css('border', '');
	});
}
function redirect(url){
	window.location.href = url;
}
function createAccount(){
	errorHighlight(0);
	setErrorText("");
	if (!checkUsername($('#username').val())) return false;
	if (!checkPassword($('#password').val())) return false;
	if (!checkEmail($('#email').val())) return false; 
	$.ajax({
    	type: "POST",
    	url: "/CreateAccount", 
    	data: {
    		username: $('#username').val(),
    		password: $('#password').val(),
    		email: $('#email').val()
    	},
    	success: function(data) { 
    		var json = JSON.parse(data);
    		if (json.id) {
    			setErrorText(json.message);
    			errorHighlight(json.id)
    		}
    		else {
    			redirect("/Login");
    		}
    	}, 
    	error: function(xhr, status, error){
    		console.log("XHR STATUS CODE: " + xhr.status);
    		console.log("STATUS: " + status);
   			console.log("ERROR: " + error);
    	}
    });
}
function login(){
	errorHighlight(0);
	setErrorText("");
	$.ajax({
    	type: "POST",
    	url: "/CheckAccount", 
    	data: { 
    		username: $('#username').val(),
    		password: $('#password').val(),
    	},
    	success: function(data) { 
    		var json = JSON.parse(data);
    		if (json.id) {
    			setErrorText(json.message);
    		}
    		else {
    			redirect("/Game");
    		}
    	}, 
    	error: function(xhr, status, error){
    		console.log("XHR STATUS CODE: " + xhr.status);
    		console.log("STATUS: " + status);
   			console.log("ERROR: " + error);
    	}
    });
}