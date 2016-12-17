<?php 

	require_once "MYSQL.php";

	$username = $argv[1];
	$password = $argv[2];
	$email = $argv[3];

	if (!$username) {
		echo(json_encode(array('message' => 'Username cannot be blank', 'id' => 'username')));
		exit();
	}
	if (!$password) {
		echo(json_encode(array('message' => 'Password cannot be blank', 'id' => 'password')));
		exit();
	}
	if (!$email) {
		echo(json_encode(array('message' => 'Password cannot be blank', 'id' => 'email')));
		exit();
	}

	$result = query("SELECT ID FROM Users WHERE Username ='$username'");
	if ($result->num_rows > 0) {
        echo(json_encode(array('message' => 'An account with that username already exists', 'id' => 'username')));
        exit();
	}
	$result = query("SELECT ID FROM Users WHERE Email='$email'");
	if ($result->num_rows > 0) {
        echo(json_encode(array('message' => 'An account with that email already exists', 'id' => 'email')));
        exit;
	}

	query("INSERT INTO Users(Username, Password, Email) VALUES('$username','$password','$email')");
    
    echo(json_encode(array('message' => 'Success', 'id' => '')));



?>