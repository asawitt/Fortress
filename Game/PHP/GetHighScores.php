<?php 
	require_once "MYSQL.php";

	$result = query("SELECT HighScores.score, Users.username FROM HighScores INNER JOIN Users on HighScores.PlayerID = Users.ID 
		ORDER BY HighScores.score DESC LIMIT 10");
	
	$scores = array();
	while ($row = $result->fetch_assoc()){
		array_push($scores, $row);
	}

	echo (json_encode($scores));
?>