$(document).ready(function(){
	$.ajax({
    	type: "POST",
    	url: "/GetHighScores", 
    	success: function(data) { 
    		var json = JSON.parse(data);
    		$('#scoresTableBody').html();
    		var i = 0;
    		var score;
    		var username = json[11];
    		console.log(username);
    		while ((score = json[i]) != null && i <= 10){
    			i++;
    			if (score['username'] == username){
    				$('#scoresTableBody').append("<tr id='usersScore'><td>" + i + " </td><td>" + score['username'] + "</td><td>" + score['score'] + "</td></tr>");
    			} else {
    				$('#scoresTableBody').append("<tr><td>" + i + " </td><td>" + score['username'] + "</td><td>" + score['score'] + "</td></tr>");
    			}
    		}


  			


    	}, 
    	error: function(xhr, status, error){
    		console.log("XHR STATUS CODE: " + xhr.status);
    		console.log("STATUS: " + status);
   			console.log("ERROR: " + error);
    	}

    });

    $("#playAgainBtn").click(function(){
    	window.location.href = "/Game";
    });

});