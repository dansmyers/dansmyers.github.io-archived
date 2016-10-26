//*** Classes for randomized problem generation ***//

// The Problem class represents a randomly generated program.
//
// It contains the code of the program, its question variable,
// and its solution value.
//
// Input: a model with the parameters for the new problem
//
// Returns: the new Problem object
var Problem = function(model) {
  
  this.model = model;
  
  this.functionNames = ['foo', 'bar', 'baz']
  
  // Bookkeeping during problem generation
  this.currentLogicalLevel = 0;
  this.statementsGenerated = 0;
  this.localVars = [];
  this.currentBody = '';
  this.currentFunctionLevel = 0;
  this.generatedFunctionsList = [];
  this.numGeneratedFunctions = 0;
  this.inLoop = false;
  this.loopIterations = 0;
  
  // Stacks for keeping track of the current local context
  // Used for constructing functions
  this.localVarsStack = [];
  this.currentBodyStack = [];
  this.logicalLevelStack = [];
    
  // Bookkeeping for output
  this.program = '';
  this.symbols = [];
  this.answer = undefined;
  this.selectedFeatures = [];
    
  // Generate the problem
  this.generate();
}


//*** Select a random integer value from the given range **//
//
// Inputs: min and max of the range
//
// Returns: a random int in [min, max - 1]
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


//*** Returns an indent string for the current logical level **///
Problem.prototype.getCurrentIndent = function() {
  var indent = '';
  for (var i = 0; i < this.currentLogicalLevel; i++) {
    indent += '  ';
  }
  return indent;
}


//*** Chose random variable marked as "free" in the local list ***//
//
// Inputs: the list of variables for the current local scope
//
// Returns: the variable list entry for the selected free variable
Problem.prototype.chooseRandFreeVar = function() {
  
  var chosen = false;
  while (!chosen) {    
    var ix = getRandomInt(0, this.localVars.length);
    
    if (this.localVars[ix].free) {
      chosen = true;
    }
  }
  
  return this.localVars[ix];
}


//*** Chose a random variable with a defined value ***//
//
// This function is only called after at least one variable has been
// initialized, which guarantees there will always be at least
// one acceptable choice.
//
// Inputs:
//   the left-hand variable chosen for the current assignment
//   (gurantees that we won't choose the same variable on the
//   left and right sides of an assignment)
//
// Returns: the variable list entry for the selected defined variable
Problem.prototype.chooseRandDefinedVar = function(lhsVar) {
  
  var chosen = false;
  while (!chosen) {
    var ix = getRandomInt(0, this.localVars.length);
    
    if (this.localVars[ix].value != undefined 
        && this.localVars[ix] != lhsVar) {
      chosen = true;
    }
  }
  
  return this.localVars[ix];
}


//*** Generate the initial variable declarations ***//
Problem.prototype.generateVariableDeclarations = function() {
  
  for (var i = 0; i < this.localVars.length; i++) {
    
    // If this variable is a function parameter it will already
    // have an assigned value
    if (this.localVars[i].value != undefined) {
      continue;
    }
    
    var statement = this.getCurrentIndent() + 'var ';
    statement += this.localVars[i].name + ' = ';
    
    if (i == 0) {
      statement += '1';
      this.localVars[i].value = 1;
    } else {
    
      // Try to pick two defined variables
      var firstVar = this.chooseRandDefinedVar(this.localVars[i]);
      var secondVar = this.chooseRandDefinedVar(this.localVars[i]);
    
      // Combine a single defined variable with a constant
      if (firstVar == secondVar) {
        var num = Math.ceil(Math.random() * this.model.maxNumber);
    
        statement += firstVar.name + ' + ' + num;
        this.localVars[i].value = firstVar.value + num;
        firstVar.free = true;
      }
      
      // Case where there are two defined variables
      else {
        statement += firstVar.name + ' + ' + secondVar.name;
        this.localVars[i].value = firstVar.value + secondVar.value;
        firstVar.free = true;
        secondVar.free = true;
      }
    }
    
    this.localVars[i].free = false;
    
    statement += ';\n';    
    this.currentBody += statement;
  }

  this.currentBody += '\n';
  return;
}


//*** Generates a basic assignment statement ***//
Problem.prototype.generateBasicAssignment = function() {
  
    // Pick a free variable for the left-hand side
    var lhsVar = this.chooseRandFreeVar();
    
    // Pick two variables for the RHS
    // For loops, the LHS variable will also appear on the RHS
    if (this.inLoop) {    
      var firstRHSVar = lhsVar;
      var secondRHSVar = this.chooseRandDefinedVar(lhsVar);
    } else {
      var firstRHSVar = this.chooseRandDefinedVar(lhsVar);    
      var secondRHSVar = this.chooseRandDefinedVar(lhsVar);
    }
    
    // If the same var is selected twice, make one a number
    if (firstRHSVar == secondRHSVar) {
      var value = Math.ceil(Math.random() * this.model.maxNumber);
      secondRHSVar = {'name': String(value), 'value': value, 
                      'free': true};
    }
    
    // Construct the statement
    var statement = lhsVar.name + ' = ';
    statement += firstRHSVar.name + ' + '
                 + secondRHSVar.name + ';';
    statement = this.getCurrentIndent() + statement;
    
    // Update the value of the LHS variable
    if (this.inLoop) {
       for (var i = 0; i < this.loopIterations; i++) {
         lhsVar.value = firstRHSVar.value + secondRHSVar.value;
       }  
    }
    else {               
      lhsVar.value = firstRHSVar.value + secondRHSVar.value;
    }
            
    // Update variable information
    firstRHSVar.free = true;
    secondRHSVar.free = true;
    lhsVar.free = false;
    
    return statement;
}


//*** Creates a copy of the local variables array ***//
Problem.prototype.cloneLocalVars = function() {
  var clones = []
      
  for (var i = 0; i < this.localVars.length; i++) {
    var clone = {'name' : this.localVars[i].name,
                 'value' : this.localVars[i].value,
                 'free' : this.localVars[i].free};
    clones.push(clone);
  }
  
  return clones;
}


//*** Generate an if statement ***//
Problem.prototype.generateIf = function() {
  
  // Create a relational condition
  // Pick two defined variables
  var firstVar = this.chooseRandDefinedVar(null);
  var secondVar = this.chooseRandDefinedVar(firstVar);
  var condition = firstVar.name + ' > ' + secondVar.name;
  
  // If the branch is not taken, save the local variables so they
  // can be restored after generating the statement
  var taken = false;
  if (firstVar.value > secondVar.value) {
    taken = true;
  }
  
  if (!taken) {
    var savedValues = this.cloneLocalVars();
  }
  
  // The declaration of the if statement
  var ifBlock = this.getCurrentIndent() + 'if (' + condition + ') {';
  this.currentLogicalLevel += 1;
  
  // Generate the contents of the if block
  var numIfStatements = 0;
  do {
    var statement = this.generateStatement();
    ifBlock += '\n' + statement;
    numIfStatements += 1;
  } while (numIfStatements < this.model.maxStatementsInConditional
         && this.statementsGenerated < this.model.maxStatements);
  
  this.currentLogicalLevel -= 1;
  ifBlock += '\n' + this.getCurrentIndent() + '}';
  
  // If the branch was not taken, none of the local variables changed
  // Restore their values from before the if block was generated
  if (!taken) {
    for (var i = 0; i < savedValues.length; i++) {
      this.localVars[i].value = savedValues[i].value;
      this.localVars[i].free = savedValues[i].free;
    }
  }
  
  return ifBlock;
}


//*** Generates an if-else pair ***//
Problem.prototype.generateIfElse = function() {
  
  // Create a relational condition
  // Pick two defined variables
  var firstVar = this.chooseRandDefinedVar(null);
  var secondVar = this.chooseRandDefinedVar(firstVar);
  var condition = firstVar.name + ' > ' + secondVar.name;
  
  // If the branch is not taken, save the local variables so they
  // can be restored after generating the statement
  var taken = false;
  if (firstVar.value > secondVar.value) {
    taken = true;
  }
  
  if (!taken) {
    var savedValues = this.cloneLocalVars();
  }
  
  // The declaration of the if statement
  var block = this.getCurrentIndent() + 'if (' + condition + ') {';
  this.currentLogicalLevel += 1;
  
  // Generate the contents of the if block
  var numIfStatements = 0;
  do {
    var statement = this.generateStatement();
    block += '\n' + statement;
    numIfStatements += 1;
  } while (numIfStatements < this.model.maxStatementsInConditional
         && this.statementsGenerated < this.model.maxStatements);
  
  this.currentLogicalLevel -= 1;
  block += '\n' + this.getCurrentIndent() + '}';
  
  // If the branch was not taken, none of the local variables changed
  // Restore their values from before the if block was generated
  if (!taken) {
    for (var i = 0; i < savedValues.length; i++) {
      this.localVars[i].value = savedValues[i].value;
      this.localVars[i].free = savedValues[i].free;
    }
  }
  
  // If the branch was taken, save the local vars so their values
  // are not changed while generating the else block
  if (taken) {
    var savedValues = this.cloneLocalVars();
  }
  
  block += this.getCurrentIndent() + ' else {';
  this.currentLogicalLevel += 1;
  var numElseStatements = 0;
  do {
    var statement = this.generateStatement();
    block += '\n' + statement;
    numElseStatements += 1;
  } while (numElseStatements < this.model.maxStatementsInConditional
         && this.statementsGenerated < this.model.maxStatements);
  this.currentLogicalLevel -= 1;
  block += '\n' + this.getCurrentIndent() + '}';
  
  // If the else block was not taken, restore the variable values
  // to what they were after generating the if block
  if (taken) {
    for (var i = 0; i < savedValues.length; i++) {
      this.localVars[i].value = savedValues[i].value;
      this.localVars[i].free = savedValues[i].free;
    }
  }

  return block;
}


//*** Returns the string representation of an argument list ***//
function getArgString(argList) {
  var argString = '';
  
  for (var i = 0; i < argList.length - 1; i++) {
    argString += argList[i].name + ', ';
  } 
  if (argList.length > 0) {
    argString += argList[argList.length - 1].name;
  }
  
  return argString;
}


//*** Returns the current number of free local variables ***//
Problem.prototype.numFreeVariables = function() {
  var count = 0;
  for (var i = 0; i < this.localVars.length; i++) {
    if (this.localVars[i].free) {
      count++;
    }
  }
  return count;
}


//*** Generates a function ***//
Problem.prototype.generateFunction = function() {
    
  this.currentFunctionLevel += 1;
    
  // Select variables to use as input arguments

  // Generating a function call with zero arguments requires having
  // at least two free variables: one to appear on the left-hand side
  // of the function call and one to remain free
  var minArgs = Math.max(0,
                this.model.maxFunctionArgs - this.numFreeVariables());
  
  var numArgs = getRandomInt(minArgs, this.model.maxFunctionArgs + 1);
  var callingArgsList = [];
  var funcParamsList = []
  for (var i = 0; i < numArgs; i++) {
    var arg = this.chooseRandDefinedVar(null);
    
    callingArgsList.push(arg)
    
    // Clone the argument variable for the new function's local
    // scope. Give it a new name and copy its value so changes don't
    // affect the value in the original scope.
    var charOffset = i + this.model.numVariables * this.currentFunctionLevel;    
    var newName = String.fromCharCode('m'.charCodeAt(0) + charOffset);
    
    var newArg = {'name': newName,
                  'value': arg.value,
                  'free': false};
    funcParamsList.push(newArg)
  }
  
  // Use the next function name
  var functionName = this.functionNames[this.numGeneratedFunctions];
  
  // Construct the calling statement
  var lhsVar = this.chooseRandFreeVar();
  var callingStatement = this.getCurrentIndent() + lhsVar.name;
  callingStatement += ' = ' + functionName + '(';
  callingStatement += getArgString(callingArgsList);
  callingStatement += ');';
    
  // Save the current body and the current local variables
  this.currentBodyStack.push(this.currentBody);
  this.localVarsStack.push(this.localVars);
  this.logicalLevelStack.push(this.currentLogicalLevel);
  
  // Reset the logical level to a single indent
  this.currentLogicalLevel = 1;
  
  this.numGeneratedFunctions += 1;
      
  // Construct the function body
  var functionCode = 'function ' + functionName + '(';
  functionCode += getArgString(funcParamsList) + ') {\n';
  this.currentBody = '';
  var result = this.generateBody(funcParamsList);
  functionCode += result[0];
  functionCode += '\n}\n';
  
  // Save the new function: all function will be combined in LIFO
  // order to create the final program
  this.generatedFunctionsList.push(functionCode);

  // Update the value of the lhs variable
  for (var i = 0; i < callingArgsList.length; i++) {
    callingArgsList[i].free = true;
  }
  lhsVar.free = false;
  lhsVar.value = result[1];
  
  // Restore the generator state
  this.currentBody = this.currentBodyStack.pop();
  this.localVars = this.localVarsStack.pop();
  this.currentLogicalLevel = this.logicalLevelStack.pop();
  this.currentFunctionLevel -= 1;
    
  return callingStatement;
}


//*** Generate a for loop ***//
Problem.prototype.generateFor = function() {
  
  // Figure out how many times the loop should execute
  var iterations = getRandomInt(1, 4);
  
  // Select the loop index variable
  var charOffset = this.currentLogicalLevel;
  var indexVar = String.fromCharCode('i'.charCodeAt(0) + charOffset);
  
  // Add the index var to the list of symbols if it's not there
  if (this.symbols.indexOf(indexVar) == -1) {
    this.symbols.push(indexVar);
  }
  
  // Loop header
  var statement = this.getCurrentIndent() + 'for (var ';
  statement += indexVar + ' = 0; ';
  statement += indexVar + ' < ' + iterations + '; ';
  statement += indexVar + '++) {\n'
  
  this.currentLogicalLevel += 1;
  var savedInLoop = this.inLoop;
  var savedLoopIterations = this.loopIterations;
  this.inLoop = true;
  this.loopIterations = iterations;
  
  // Generate a for loop statement
  statement += this.generateStatement() + '\n';
    
  this.currentLogicalLevel -= 1;
  this.inLoop = savedInLoop;
  this.loopIterations = savedLoopIterations;
  
  statement += this.getCurrentIndent() + '}';
  
  // Update the value of the lhs variable by simulating the loop
  
  return statement;
}


//*** Generates a while loop ***//
Problem.prototype.generateWhile = function() {
  
  // Pick two variables for the relational condition
  var firstCondVar = this.chooseRandDefinedVar(null);
  var secondCondVar = this.chooseRandDefinedVar(firstCondVar);
  
  // Decide if the loop will be entered
  var entered = false;
  if (firstCondVar.value < secondCondVar.value) {
    entered = true;
  }
  
  // Construct the statement
  var statement = this.getCurrentIndent() + 'while (';
  statement += firstCondVar.name + ' < ' + secondCondVar.name;
  statement += ') {\n';
  
  this.currentLogicalLevel += 1;
  var savedInLoop = this.inLoop;
  var savedLoopIterations = this.loopIterations;
  
  // Construct the body of the loop
  var rhsVar = this.chooseRandDefinedVar(firstCondVar);
  statement += this.getCurrentIndent() + firstCondVar.name + ' = '
               + firstCondVar.name + ' + ' + rhsVar.name + ';\n'; 
                 
  this.currentLogicalLevel -= 1;
  this.inLoop = savedInLoop;
  this.loopIterations = savedLoopIterations;
  
  statement += this.getCurrentIndent() + '}';
  
  // If the loop is entered, update the value of the lhs variable
  if (entered) {
    var numIterations = (secondCondVar.value - firstCondVar.value)
                        / parseFloat(rhsVar.value);
    numIterations = Math.ceil(numIterations);
    
    for (var i = 0; i < numIterations; i++) {
      firstCondVar.value += rhsVar.value;
    }
    
    rhsVar.free = true;
    firstCondVar.free = false;
  }
  
  return statement;
}

/*** Add the choice feature to the list of selected features ***/
// Each feature only appears in the list one time
Problem.prototype.updateSelectedFeatures = function(choice) {
  var add = true;
  for (var i = 0; i < this.selectedFeatures.length; i++) {
      if (this.selectedFeatures[i].feature == choice.feature) {
        add = false;
        break;
      }  
  }
  if (add) {
    this.selectedFeatures.push(choice);
  }
}

//*** Generate a single statement ***//
//
// Inputs: the variable list for the current local scope
//
// Returns: the new statement as a string
Problem.prototype.generateStatement = function() {
  
  // Decide what kind of statement to generate:
  //
  // 1. basic assignment
  // 2. if
  // 3. if-else
  // 4. assignment with function call
  // 5. for
  // 6. while
  
  this.statementsGenerated++;
    
  // Special case for reaching the maximum indent level
  if (this.currentLogicalLevel >= this.model.maxLogicalLevel) {
    statement = this.generateBasicAssignment();
    this.updateSelectedFeatures(this.model.scores[0]);
    return statement;
  }
  
  // Special case for running out of statements
  if(this.model.maxStatements - this.statementsGenerated < 1) {
    statement = this.generateBasicAssignment();
    this.updateSelectedFeatures(this.model.scores[0]);
    return statement;
  }
  
  // Basic strategy: try to pick a random statement, then filter
  // to see if it's acceptable. If not, just retry.
  //
  // A basic assignment is always acceptable, so this is guaranteed
  // to terminate.
  
  var statement = '';
  var done = false;
  while (!done) {
    var choice = this.model.selectFeature();
        
    switch(choice.feature) {
      
      // Assignment
      case 1:
        statement = this.generateBasicAssignment();
        done = true;
        break;
        
      // Basic if
      case 2:
      
        if (!this.model.ifAllowed) {
          continue;
        }
        
        statement = this.generateIf();
        done = true;
        break;
        
      // if-else
      case 3:
        if (!this.model.ifElseAllowed 
            || this.currentLogicalLevel > 0) {
          continue;
        }
                
        statement = this.generateIfElse();
        done = true;
        break;
        
      // Function
      case 4:
        if (!this.model.functionAllowed 
            || this.currentFunctionLevel >= this.model.maxFunctionLevel
            || this.numGeneratedFunctions >= this.model.maxNumFunctions) {
          continue;
        }
        
        statement = this.generateFunction();
        done = true;
        break;
        
      // for
      case 5:
        if (!this.model.forAllowed) {
          continue;
        }
        
        statement = this.generateFor();
        done = true;
        break;
        
      // while
      case 6:
        if (!this.model.whileAllowed) {
          continue;
        }
      
        statement = this.generateWhile();
        done = true;
        break;
    }
  }
  

  this.updateSelectedFeatures(choice);
  
  return statement;
}


//*** Generate the body of a function ***//
//
// This includes the main part of the program. A body consists of
// a local variable declaration block followed by a block of
// statements.
//
// Inputs: a list of input argument objects
//   this list is always empty for the main body
//
// Returns: the function body as a string
Problem.prototype.generateBody = function(inputArgs) {
    
  // Create the list of variables for the local scope
  this.localVars = inputArgs;
  
  if (this.currentFunctionLevel == 0) {
    var startCh = 'a'.charCodeAt(0);
    var numVars = this.model.numVariables;
  } else {
    var startCh = 'm'.charCodeAt(0);
    var numVars = this.model.maxFunctionVariables;
  }
  for (var i = this.localVars.length; i < numVars; i++) {
    var charOffset = this.model.numVariables 
                     * this.currentFunctionLevel
                     + i;
    
    var newVar = {'name' : String.fromCharCode(startCh + charOffset),
                  'value' : undefined,
                  'free' : false};
    this.localVars.push(newVar);
  }
  
  // Update symbol list
  for (var i = 0; i < this.localVars.length; i++) {
    if (this.symbols.indexOf(this.localVars[i].name) == -1) {
      this.symbols.push(this.localVars[i].name);  
    }
  }
    
  // Generate the variable declaration block
  this.generateVariableDeclarations();

  // Generate the body statements
  while (this.statementsGenerated < this.model.maxStatements) {
    var statement = this.generateStatement();
    this.currentBody += statement + '\n';
  }
  
  // Functions end with a return, main with a print statement
  var finalStatement = this.getCurrentIndent();
  if (this.currentFunctionLevel > 0) {
    finalStatement += 'return ';
  } else {
    finalStatement += 'print ';
  }
  
  // The final statement is the sum of all vars in the current scope
  var finalValue = 0;
  for (var i = 0; i < this.localVars.length - 1; i++) {
    finalValue += this.localVars[i].value;
    finalStatement += this.localVars[i].name + ' + ';
  }
  finalValue += this.localVars[this.localVars.length - 1].value;
  finalStatement += this.localVars[this.localVars.length - 1].name 
                    + ';';
  
  this.currentBody += '\n' + finalStatement;
  
  return [this.currentBody, finalValue];
}


//*** Generates a new problem **///
//
// The generation creates the main program body.
//
// Other elements, like functions, will be recursively created as
// the main body generates. The program is complete when the
// generator reaches the end of the main body.
Problem.prototype.generate = function() {
  var result = this.generateBody([]);
  var main = result[0];
  this.answer = result[1];
  
  // Combine all functions and main to create the program
  for (var i = 0; i < this.generatedFunctionsList.length; i++) {
    this.program += this.generatedFunctionsList[i] + '\n';
  }
  this.program += main;
  
  // Clean up the spacing of the final program
  this.program = this.program.replace('\n\n\n', '\n\n');

  // Output answer to the console for debugging
  console.log(this.answer);
}

