<?php 
	require_once "MYSQL.php";

	$username = $argv[1];
	$score = intval($argv[2]); 

	if (! $score | !$username){
		 echo(json_encode(array('message' => 'Score and/or username blank', 'id' => 1)));
		 exit();
	}

	$id = query("SELECT ID FROM Users WHERE Username ='$username'");
	if ($id->num_rows == 0){
		 echo(json_encode(array('message' => 'No id for specified username', 'id' => 1)));
		 exit();
	}
	$id = $id->fetch_assoc()['ID'];
	$score_exists = query("SELECT Score FROM HighScores WHERE PlayerID = '$id'");
	if ($score_exists->num_rows != 0){
		$old_score = $score_exists->fetch_assoc();
		$old_score = $old_score['Score'];
		if ($score > $old_score){
			query("UPDATE HighScores SET Score = '$score' WHERE PlayerID = '$id'");
		}
	} 
	else {
		query("INSERT INTO HighScores(PlayerId, Score) Values('$id', '$score')");
	}
?>