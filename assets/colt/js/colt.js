//*** Coding Literacy Trainer main script ***//


//*** Constuctor ***//
var CodingLiteracyTrainer = function() {
	
	// Constant parameters
	this.MAX_ALLOWED_CHECKS = 2; // Num. checks before marking incorrect
	this.REFRESH_DELAY = 1500;
	
	// Trainer state variables
	this.currentProblem = null;
		
  // TODO: Add code to handle saved state
  // Load saved state from local storage
  // Use saved state if it's present

  // If saved state is not present, start with basic problem classes
	this.model = new LearningModel();
	
	// Set up handler for use responses
	var myself = this;  // Alias to this object
	$('#submit').click(function() {
		myself.checkAnswer();
	});
}


//*** Generates the next problem after a short delay ***//
CodingLiteracyTrainer.prototype.nextProblemAfterDelay = function() {
	var trainer = this;
	window.setTimeout(function() {
		$('#response').html('');
		trainer.nextProblem();
	}, this.REFRESH_DELAY);
}


/*** Triggers modal popups when new features are unlocked ***/
CodingLiteracyTrainer.prototype.displayModal = function(unlocked) {

}


//*** User response handler ***//
//
// Runs when the user clicks the "Submit" button
//
// Input: the current Problem instance
//
// Effects: Outputs a correct/incorrect message to the interface.
//   If the response is correct, load another problem.
CodingLiteracyTrainer.prototype.checkAnswer = function() {
	var answer = parseInt($('#answer').val());
	
	var problem = this.currentProblem;
	problem.numTimesChecked += 1;
	
	// Correct
	if (answer == problem.answer) {
		$('#response').html('Correct!');
		
		for (var i = 0; i < problem.selectedFeatures.length; i++) {
		    problem.selectedFeatures[i].correct += 1;
	  }
		
		// Check for new unlocked features
		var unlocked = this.model.checkForUnlockedFeatures();
		if (unlocked > 0) {
			this.displayModal(unlocked);
		}
		
		this.nextProblemAfterDelay();
	} 
	
	// Out of chances on this problem
	else if (problem.numTimesChecked == this.MAX_ALLOWED_CHECKS) {
		$('#response').html('Let\'s try another one.');
		
		for (var i = 0; i < problem.selectedFeatures.length; i++) {
		    problem.selectedFeatures[i].incorrect += 1;
	  } 
		
		this.nextProblemAfterDelay();
	}
	
	// At least one chance remaining
	else {
		$('#response').html('Try again.');
	}
}


//*** Update the interface with a new problem and question ***//
//
// Input: a Problem instance
//
// Effects: writes the problem code, new problem question, and
//   variable scratchpad to the interface
CodingLiteracyTrainer.prototype.displayProblem = function(problem) {
	// Insert the program into its text box
	$('#program').text(problem.program);

	// Display the question variable and its prompt
	var questionVar = problem.questionVariable;
	var questionString = 'What value is printed by the final line of'
	                     + ' the program?'
	$('#question').html(questionString);
	
	// Scratchpad of problem symbols
	$('#scratchpad').html('');  // Clear current scratchpad
	
	var symbols = problem.symbols;	
	for (var i = 0; i < symbols.length; i++) {
			var htmlString = '<p><code>' + symbols[i] + ' = </code>' +      
											'<input  type = "text"></input></p>';
			$('#scratchpad').append(htmlString);
	}
}


//*** Generate and display a new random problem ***//
CodingLiteracyTrainer.prototype.nextProblem = function () {
				
	// Generate a problem from the chosen class
	// The resulting Problem object contains the result of generation
	var problem = new Problem(this.model);
	this.currentProblem = problem;
	this.currentProblem.numTimesChecked = 0;
	
	// Update the interface
	this.displayProblem(problem);
	
	// A handler for the user's response was already initialized in
	// the CodingLiteracyTrainer constructor
}
	
	
//*** Main ***//
//
// Constructs the CodingLiteracyTrainer object and generates the
// first randomized problem
//
// Runs when the page loads
function main() {
	var trainer = new CodingLiteracyTrainer();
	trainer.nextProblem();
}
	
	
//*** Generates the first problem when the page is ready ***//
$('document').ready(main);
