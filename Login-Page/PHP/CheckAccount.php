<?php 
	session_start();

	require_once "MYSQL.php";

	$username = $argv[1];
	$password = $argv[2];

	if (!$username) {
		echo(json_encode(array('message' => 'Username cannot be blank', 'id' => 'username')));
		exit();
	}
	if (!$password) {
		echo(json_encode(array('message' => 'Password cannot be blank', 'id' => 'password')));
		exit();
	}
	$result = query("SELECT ID FROM Users WHERE (Username ='$username' OR Email = '$username') AND Password = '$password'");
	if ($result->num_rows > 0) {
        echo(json_encode(array('message' => 'Success', 'id' => 0)));
        $_SESSION['username'] = '$username';
        exit();
	}

    echo(json_encode(array('message' => 'Incorrect username and/or password', 'id' => 1)));



?>