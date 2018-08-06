/**
 * An object that manages the feedback area, where users are told the state of their
 * program's execution and given guidance. Also manages the creation of the Trace Table.
 *
 * @constructor
 * @this {BlockPyFeedback}
 * @param {Object} main - The main BlockPy instance
 * @param {HTMLElement} tag - The HTML object this is attached to.
 */
function BlockPyFeedback(main, tag) {
    this.main = main;
    this.tag = tag;
    
    this.body = this.tag.find('.blockpy-feedback-body');
    this.title = this.tag.find('.blockpy-feedback-title');
    this.original = this.tag.find('.blockpy-feedback-original');
    this.status = this.tag.find('.blockpy-feedback-status');
    this.trace = this.tag.find('.blockpy-feedback-trace');
    
    // Reload the tracetable on click
    this.trace.click(this.buildTraceTable.bind(this));
    
    this.original.hide();
};

BlockPyFeedback.prototype.scrollIntoView = function() {
    $('html, body').animate({
        scrollTop: this.tag.offset().top
    }, 1000);
}

BlockPyFeedback.prototype.isFeedbackVisible = function () {
    var top_of_element = this.tag.offset().top;
    var bottom_of_element = this.tag.offset().top + this.tag.outerHeight();
    var bottom_of_screen = $(window).scrollTop() + $(window).height();
    var top_of_screen = $(window).scrollTop(); 
    //bottom_of_element -= 40; // User friendly padding
    return ((bottom_of_screen > top_of_element) && (top_of_screen < bottom_of_element));
}

/**
 * Reload the trace table, showing it if it was hidden and
 * resetting its position to the last step.
 */
BlockPyFeedback.prototype.buildTraceTable = function() {
    var execution = this.main.model.execution;
    execution.show_trace(true);
    execution.trace_step(execution.last_step());
    this.main.components.server.logEvent('editor', 'trace');
}

/**
 * Raises a generic warning. This might not be used anymore.
 *
 * @param {String} html - Some HTML content to render to the user.
 */
BlockPyFeedback.prototype.error = function(html) {
    this.tag.html(html);
    this.tag.removeClass("alert-success");
    this.tag.addClass("alert-warning");
    this.main.components.printer.print("Execution stopped - there was an error!");
}

/**
 * Clears any output currently in the feedback area. Also resets the printer and
 * any highlighted lines in the editor.
 */
BlockPyFeedback.prototype.clear = function(printer) {
    this.title.html("Ready");
    this.original.hide();
    this.body.html("");
    this.main.model.status.error("none");
    this.main.components.editor.unhighlightLines();
    if (printer !== undefined && printer) {
        this.main.components.printer.resetPrinter()
    }
};

/**
 * Clears any errors from the editor area.
 */
BlockPyFeedback.prototype.clearEditorErrors = function() {
    if (this.main.model.status.error() == "editor") {
        this.clear();
    }
}

/**
 * Show an error message related to a problem with the editor. This will appear in
 * the Feedback area, the Printer, and also log to the server. The relevant line of
 * code or block will also be highlighted.
 *
 * @param {String} original - HTML content that represents the original error message generated by the system.
 * @param {String} message - HTML content that is a hopefully friendlier message for the user explaining the error.
 * @param {number} line - What line the error occurred on.
 */
BlockPyFeedback.prototype.editorError = function(original, message, line) {
    original = this.prettyPrintError(original);
    this.title.html("Editor Error");
    this.original.show().html(original);
    this.body.html(message);
    this.main.model.status.error("editor");
    this.main.components.editor.highlightError(line-1);
    //this.main.components.printer.print("Editor error - could not make blocks!");
    this.main.components.server.logEvent('feedback', "Editor Error", original+"\n|\n"+message);
}

/**
 * Mark this problem as completed for the student. This will appear in the Feedback area,
 * and will also unhighlight lines in the editor and log to the server.
 */
BlockPyFeedback.prototype.complete = function() {
    this.title.html("Complete!");
    this.original.hide();
    this.body.html("Great work!");
    this.main.model.status.error("complete");
    this.main.components.editor.unhighlightLines();
    this.main.components.server.logEvent('feedback', "Success");
}

/**
 * Mark this problem as finished for the student. This will appear in the Feedback area,
 * and will also unhighlight lines in the editor and log to the server.
 */
BlockPyFeedback.prototype.finished = function() {
    this.title.html("Ran");
    this.original.hide();
    this.body.html("Your program ran successfully, without any errors. However, this problem does not have a correct solution. When you are satisfied with your program, you may stop working.");
    this.main.model.status.error("no errors");
    this.main.components.editor.unhighlightLines();
    this.main.components.server.logEvent('feedback', "Finished");
}

/**
 * This notifies the student that their code ran without errors, but that there was no
 * Success raised by the Checker. This will appear in the Feedback area,
 * and will also unhighlight lines in the editor and log to the server.
 */
BlockPyFeedback.prototype.noErrors = function() {
    this.title.html("Ran");
    this.original.hide();
    this.body.html("No errors reported. View your output on the left.");
    this.main.model.status.error("no errors");
    this.main.components.editor.unhighlightLines();
    this.main.components.server.logEvent('feedback', "No Errors", '');
}

/**
 * Show an error message related to syntax issue. This will appear in
 * the Feedback area, the Printer, and also log to the server. The relevant line of
 * code or block will also be highlighted.
 *
 * @param {String} original - HTML content that represents the original error message generated by the system.
 * @param {String} message - HTML content that is a hopefully friendlier message for the user explaining the error.
 * @param {number} line - What line the error occurred on.
 */
BlockPyFeedback.prototype.syntaxError = function(original, message, line) {
    original = this.prettyPrintError(original);
    this.title.html("Syntax Error");
    this.original.show().html(original);
    this.body.html(message);
    this.main.model.status.error("syntax");
    this.main.components.editor.highlightError(line-1);
    this.main.components.printer.print("Execution stopped - there was an error!");
    this.main.components.server.logEvent('feedback', "Syntax Error", original+"\n|\n"+message);
}

/**
 * Show an error message related to semantic error with the program (e.g., unused variable). 
 * This will appear in the Feedback area, the Printer, and also log to the server. The
 * relevant line of code or block will also be highlighted.
 *
 * @param {String} original - HTML content that represents the original error message generated by the system.
 * @param {String} message - HTML content that is a hopefully friendlier message for the user explaining the error.
 * @param {number} line - What line the error occurred on.
 */
BlockPyFeedback.prototype.semanticError = function(name, message, line) {
    this.title.html(name);
    this.original.hide();
    this.body.html(message);
    this.main.model.status.error("semantic");
    if (line !== null) {
        this.main.components.editor.highlightError(line-1);
    }
    this.main.components.printer.print("Execution stopped - there was an error!");
    this.main.components.server.logEvent('feedback', "Semantic Error", name+"\n|\n"+message);
}

/**
 * Show an error message related to a serious internal BlockPy program. Under normal conditions,
 * this should never appear to a student. This will appear in
 * the Feedback area, the Printer, and also log to the server. The relevant line of
 * code or block will also be highlighted.
 *
 * @param {String} original - HTML content that represents the original error message generated by the system.
 * @param {String} message - HTML content that is a hopefully friendlier message for the user explaining the error.
 * @param {number} line - What line the error occurred on.
 */
BlockPyFeedback.prototype.internalError = function(original, name, message) {
    original = this.prettyPrintError(original);
    this.title.html(name);
    this.original.show().html(original);
    this.body.html(message);
    this.main.model.status.error("internal");
    this.main.components.printer.print("Internal error! Please show this to an instructor!");
    this.main.components.server.logEvent('feedback', "Internal Error", name+"\n|\n"+original+"\n|\n"+message);
    console.error(original);
}

/**
 * Show an incorrect code message related to a problem as specified by the Checker. This will appear in
 * the Feedback area, the Printer, and also log to the server. The relevant line of
 * code or block will also be highlighted.
 *
 * @param {String} original - HTML content that represents the original error message generated by the system.
 * @param {String} message - HTML content that is a hopefully friendlier message for the user explaining the error.
 * @param {number} line - What line the error occurred on.
 */
BlockPyFeedback.prototype.instructorFeedback = function(name, message, line) {
    this.title.html(name);
    this.original.hide();
    this.body.html(message);
    this.main.model.status.error("feedback");
    if (line !== undefined && line != null) {
        this.main.components.editor.highlightError(line-1);
    }
    this.main.components.server.logEvent('feedback', "Instructor Feedback", name+"\n|\n"+"\n|\n"+message);
}

/**
 * Show "Empty Program" error, indicating the student hasn't written any code. This will appear in
 * the Feedback area, the Printer, and also log to the server. The relevant line of
 * code or block will also be highlighted.
 *
 * @param {String} original - HTML content that represents the original error message generated by the system.
 * @param {String} message - HTML content that is a hopefully friendlier message for the user explaining the error.
 * @param {number} line - What line the error occurred on.
 */
BlockPyFeedback.prototype.emptyProgram = function() {
    this.title.html("Blank Program");
    this.original.hide().html("");
    this.body.html("You have not written any code yet.");
    this.main.model.status.error("runtime");
    this.main.components.server.logEvent('feedback', "Empty Program");
}

/**
 * Converts any kind of error (usually a Skulpt one) into a prettier version that's ready
 * for users to see. If it's already a string, it is passed along unchanged. But Skulpt
 * errors have to be processed more closely.
 */
BlockPyFeedback.prototype.prettyPrintError = function(error) {
    if (typeof error === "string") {
        return error;
    } else {
        // A weird skulpt thing?
        console.error(error);
        if (error.tp$str !== undefined) {
            return error.tp$str().v;
        } else {
            return ""+error.name + ": " + error.message;
        }
    }
}

/**
 * Print an error to the printers -- the on screen one and the browser one. This
 * will attempt to provide extra explanation and context for an error.
 * Notice that this is largely for Run-time errors that will be thrown when the code
 * is executed, as opposed to ones raised elsewhere in the environment.
 * 
 * @param {String} error - The error message to be analyzed and printed.
 */
BlockPyFeedback.prototype.printError = function(error) {
    //console.log(error);
    original = this.prettyPrintError(error);
    this.title.html(error.tp$name);
    this.original.show().html(original);
    if (error.tp$name == "ParseError") {
        this.body.html("While attempting to convert the Python code into blocks, I found a syntax error. In other words, your Python code has a spelling or grammatical mistake. You should check to make sure that you have written all of your code correctly. To me, it looks like the problem is on line "+ error.args.v[2]+', where it says:<br><code>'+error.args.v[3][2]+'</code>', error.args.v[2]);
    } else if (error.constructor == Sk.builtin.NameError
                && error.args.v.length > 0
                && error.args.v[0].v == "name '___' is not defined") {
        this.body.html("You have incomplete blocks. Make sure that you do not have any dangling blocks or blocks that are connected incorrectly.<br><br>If you look at the text view of your Python code, you'll see <code>___</code> in the code. The converter will create these <code>___</code> to show that you have a block that's missing a piece.");
    } else if (error.tp$name in EXTENDED_ERROR_EXPLANATION) {
        this.body.html(EXTENDED_ERROR_EXPLANATION[error.tp$name]);
    } else {
        this.body.html(error.enhanced);
    }
    console.error(error);
    if (error.stack) {
        console.error(error.stack);
    }
    this.main.model.status.error("runtime");
    if (error.traceback && error.traceback.length) {
        this.main.components.editor.highlightError(error.traceback[0].lineno-1);
    }
    this.main.components.server.logEvent('feedback', "Runtime", original);
}

BlockPyFeedback.prototype.presentInstructorError = function() {
    var instructor = this.main.model.execution.reports['instructor'];
    var error = instructor.error;
    if (!error.traceback) {
        this.internalError(error, "Instructor Feedback Error", "Error in instructor feedback. Please show the above message to an instructor!");
        console.error(error);
        return 'instructor';
    } else if (error.traceback[0].filename == "__main__.py") {
        this.printError(error);
        return 'student';
    } else {
        if (error.traceback[0].filename == instructor.filename) {
            error.traceback[0].lineno -= instructor.line_offset;
            if (error.traceback[0].lineno < 0) {
                error.traceback[0].lineno += instructor.line_offset;
                this.internalError(error, "Feedback Engine Error", "Error in BlockPy's feedback generation. Please show the above message to an instructor so they can contact a developer!");
            } else {
                this.internalError(error, "Instructor Feedback Error", "Error in instructor feedback. Please show the above message to an instructor!");
            }
        }
        console.error(error);
        return 'instructor';
    }
};

/**
 * Present any accumulated feedback
 */
BlockPyFeedback.prototype.presentFeedback = function(category, label, message, line) {
    this.clear(false);
    
    if (category.toLowerCase() == "instructor" && 
        label.toLowerCase() == "explain") {
        this.title.html("Instructor Feedback");
    } else {
        this.title.html(label);
    }
    this.body.html(message);
    if (category == "Instructor" && label == "No errors") {
        this.main.model.status.error("no errors");
    } else {
        this.main.model.status.error(category);
    }
    if (line !== null && line !== undefined) {
        this.main.components.editor.highlightError(line-1);
    }
    this.main.components.server.logEvent('feedback', category+"|"+label, message);
    console.error(message);
    
    return;
    
    var report = this.main.model.execution.reports;
    var suppress = this.main.model.execution.suppressions;
    
    // Organize complaints
    var complaint = report['instructor'].complaint;
    var gentleComplaints = [];
    var verifierComplaints = [];
    if (complaint) {
        moveElements(complaint, gentleComplaints, function(e) { return e.priority == 'student' });
        moveElements(complaint, verifierComplaints, function(e) { return e.priority == 'verifier' });
    }
    
    // Verifier
    if (!suppress['verifier'] && !report['verifier'].success) {
        this.emptyProgram();
        return 'verifier';
    }
    // Parser
    if (verifierComplaints.length) {
        this.instructorFeedback(verifierComplaints[0].name, 
                                verifierComplaints[0].message, 
                                verifierComplaints[0].line);
        return 'instructor';
    }
    if (!suppress['parser'] && !report['parser'].success) {
        var parserReport = report['parser'].error;
        this.convertSkulptSyntax(parserReport);
        return 'parser';
    }
    // Error in Instructor Feedback code
    if (!report['instructor'].success) {
        this.presentInstructorError();
    }
    if (report['instructor'].compliments && report['instructor'].compliments.length) {
        //this.compliment(report['instructor'].compliments);
        console.log(report['instructor'].compliments);
    }
    if (suppress['instructor'] !== true && complaint && complaint.length) {
        complaint.sort(BlockPyFeedback.sortPriorities);
        this.instructorFeedback(complaint[0].name, complaint[0].message, complaint[0].line);
        return 'instructor';
    }
    // Analyzer
    if (!report['instructor'].hide_correctness &&
        suppress['analyzer'] !== true) {//if a subtype is specified, or no suppression requested, present feedback
        if (!report['analyzer'].success) {
            this.internalError(report['analyzer'].error, "Analyzer Error", "Error in analyzer. Please show the above message to an instructor!");
            return 'analyzer';
        }
        var wasPresented = this.presentAnalyzerFeedback();
        if (wasPresented) {
            return 'analyzer';
        }
    }
    // Student runtime errors
    if (!suppress['student']) {
        if (!report['student'].success) {
            this.printError(report['student'].error);
            return 'student';
        }
    }
    // No instructor feedback if hiding correctness
    if (report['instructor'].hide_correctness == true) {
        this.noErrors()
        return 'no errors';
    }
    // Gentle instructor feedback
    if (suppress['instructor'] !== true && gentleComplaints.length) {
        this.instructorFeedback(gentleComplaints[0].name, 
                                gentleComplaints[0].message, 
                                gentleComplaints[0].line);
        return 'instructor';
    }
    //instructor completion flag
    if (suppress['instructor'] !== true && report['instructor'].complete) {
        this.complete();
        return 'success';
    }
    if (!suppress['no errors']) {
        this.noErrors()
        return 'no errors';
    }
    return 'completed';
}

BlockPyFeedback.prototype.convertSkulptSyntax = function(skulptError) {
    var convertedError = Sk.ffi.remapToJs(skulptError.args);
    console.log(convertedError);
    var codeLine = '.';
    if (convertedError.length > 3 && convertedError[4]) {
        codeLine = ', where it says:<br><code>'+convertedError[4]+'</code>';
    }
    this.editorError(skulptError, "While attempting to process your Python code, I found a syntax error. In other words, your Python code has a mistake in it (e.g., mispelled a keyword, bad indentation, unnecessary symbol). You should check to make sure that you have written all of your code correctly. To me, it looks like the problem is on line "+ convertedError[2]+codeLine, convertedError[2]);
}

BlockPyFeedback.prototype.OPERATION_DESCRIPTION = {
    "Pow": "an exponent",
    "Add": "an addition",
    "Mult": "a multiplication",
    "Sub": "a subtraction",
    "Div": "a division",
    "Mod": "a modulo"
};
BlockPyFeedback.prototype.TYPE_DESCRIPTION = {
    "Num": "a number",
    "Str": "a string",
    "Tuple": "a tuple",
    "List": "a list",
    "Bool": "a boolean",
    "File": "a file",
    "None": "a None",
    "Set": "a set",
    "Function": "a function"
};

BlockPyFeedback.prototype.presentAnalyzerFeedback = function() {
    var report = this.main.model.execution.reports['analyzer'].issues;
    if (report === undefined) {
        return false;
    }
    var suppress = this.main.model.execution.suppressions['analyzer'] || {};
    if (suppress === true) {
        // Suppress all types of analyzer errors
        return false;
    } else if (!suppress["Action after return"] && report["Action after return"].length >= 1) {
        var variable = report["Action after return"][0];
        this.semanticError("Action after return", "You performed an action after already returning from a function, on line "+variable.position.line+". You can only return on a path once.", variable.position.line)
        return true;
    } else if (!suppress['Return outside function'] && report['Return outside function'].length >= 1) {
        var first = report['Return outside function'][0];
        this.semanticError("Return outside function", "You attempted to return outside of a function on line "+first.position.line+". But you can only return from within a function.", first.position.line)
        return true;
    /*} else if (!suppress['Write out of scope'] && report['Write out of scope'].length >= 1) {
        var first = report['Write out of scope'][0];
        this.semanticError("Write out of scope", "You attempted to write a variable from a higher scope (outside the function) on line "+first.position.line+". You should only use variables inside the function they were declared in.", first.position.line)
        return true;*/
    } else if (!suppress['Unconnected blocks'] && report["Unconnected blocks"].length >= 1) {
        var variable = report['Unconnected blocks'][0];
        this.semanticError("Unconnected blocks", "It looks like you have unconnected blocks on line "+variable.position.line+". Before you run your program, you must make sure that all of your blocks are connected and that there are no unfilled holes.", variable.position.line)
        return true;
    } else if (!suppress['Iteration variable is iteration list'] && report['Iteration variable is iteration list'].length >= 1) {
        var variable = report['Iteration variable is iteration list'][0];
        this.semanticError("Iteration Problem", "The variable <code>"+variable.name+"</code> was iterated on line "+variable.position.line+", but you used the same variable as the iteration variable. You should choose a different variable name for the iteration variable. Usually, the iteration variable is the singular form of the iteration list (e.g., <code>for dog in dogs:</code>).", variable.position.line)
        return true;
    } else if (!suppress["Undefined variables"] && report["Undefined variables"].length >= 1) {
        var variable = report["Undefined variables"][0];
        this.semanticError("Initialization Problem", "The variable <code>"+variable.name+"</code> was used on line "+variable.position.line+", but it was not given a value on a previous line. You cannot use a variable until it has been given a value.", variable.position.line)
        return true;
    } else if (!suppress["Possibly undefined variables"] && report["Possibly undefined variables"].length >= 1) {
        var variable = report["Possibly undefined variables"][0];
        var kindName = 'variable', kindBody = 'value';
        if (variable.name == '*return') {
            return false;
        } else {
            this.semanticError("Initialization Problem", "The variable <code>"+variable.name+"</code> was used on line "+variable.position.line+", but it was possibly not given a value on a previous line. You cannot use a variable until it has been given a value. Check to make sure that this variable was declared in all of the branches of your decision.", variable.position.line);
        }
        return true;
    } else if (!suppress["Unread variables"] && report["Unread variables"].length >= 1) {
        var variable = report["Unread variables"][0];
        var kindName = 'variable', kindBody = 'value';
        if (variable.type && variable.type.name == 'Function') {
            kindName = 'function';
            kindBody = 'definition';
        }
        this.semanticError("Unused Variable", "The "+kindName+" <code>"+variable.name+"</code> was given a "+kindBody+", but was never used after that.", null)
        return true;
    } else if (!suppress["Overwritten variables"] && report["Overwritten variables"].length >= 1) {
        var variable = report["Overwritten variables"][0];
        this.semanticError("Overwritten Variable", "The variable <code>"+variable.name+"</code> was given a value, but <code>"+variable.name+"</code> was changed on line "+variable.position.line+" before it was used. One of the times that you gave <code>"+variable.name+"</code> a value was incorrect.", variable.position.line)
        return true;
    } else if (!suppress["Empty iterations"] && report["Empty iterations"].length >= 1) {
        var variable = report["Empty iterations"][0];
        if (variable.name) {
            this.semanticError("Iterating over empty list", "The variable <code>"+variable.name+"</code> was set as an empty list, and then you attempted to use it in an iteration on line "+variable.position.line+". You should only iterate over non-empty lists.", variable.position.line)
            return true;
        }
    } else if (!suppress["Non-list iterations"] && report["Non-list iterations"].length >= 1) {
        var variable = report["Non-list iterations"][0];
        if (variable.name) {
            this.semanticError("Iterating over non-list", "The variable <code>"+variable.name+"</code> is not a list, but you used it in the iteration on line "+variable.position.line+". You should only iterate over sequences like lists.", variable.position.line)
            return true;
        }
    } else if (!suppress["Incompatible types"] && report["Incompatible types"].length >= 1) {
        var variable = report["Incompatible types"][0];
        var op = this.OPERATION_DESCRIPTION[variable.operation];
        var left = this.TYPE_DESCRIPTION[variable.left.name];
        var right = this.TYPE_DESCRIPTION[variable.right.name];
        this.semanticError("Incompatible types", "You used "+op+" operation with a "+left+" and a "+right+" on line "+variable.position.line+". But you can't do that with that operator. Make sure both sides of the operator are the right type.", variable.position.line)
        return true;
    } else if (!suppress['Read out of scope'] && report['Read out of scope'].length >= 1) {
        var first = report['Read out of scope'][0];
        this.semanticError("Read out of scope", "You attempted to read a variable from a different scope on line "+first.position.line+". You should only use variables inside the function they were declared in.", first.position.line)
        return true;
    }
    return false;
}

if (typeof exports !== 'undefined') {
    exports.BlockPyFeedback = BlockPyFeedback;
}