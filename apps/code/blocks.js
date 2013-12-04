/**
 * Blockly Lua: ComputerCraft
 *
 * Copyright 2013 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Blocks for ComputerCraft turtles.
 * @author ellen.spertus@gmail.com (Ellen Spertus)
 */
'use strict';

Blockly.ComputerCraft = {};

Blockly.ComputerCraft.BASE_HELP_URL = 'http://computercraft.info/wiki/';

/**
 * Whether the described block should have previous and next statement
 * connections.
 */
Blockly.ComputerCraft.StmtConns = {
  NONE: 0,
  PREVIOUS: 1,
  NEXT: 2,
  BOTH: 3  // Provided for convenience.
};

/**
 * Ways of computing a help URL as a function of other pieces of information
 * about a block.  In all cases, the URL begins with
 * Blockly.ComptuerCraft.BASE_HELP_URL.
 */
Blockly.ComputerCraft.HelpUrlType = {
  // Concatenate the prefix and funcName.
  PREFIX_NAME: 1,  // Used by Block.
  // Concatenate the prefix and chosen direction value.
  PREFIX_DIR: 2    // Used by ExpStmtBlock.
};

// This is only used in Blockly.ComputerCraft.getBlockName_ but is declared
// here to avoid recompilation.
Blockly.ComputerCraft.CAPITAL_LETTER_REGEX_ = /[A-Z]/;

/**
 * Generate a block name, such as 'peripheral_get_names'.  This is done by
 * appending:
 * - prefix
 * - an underscore
 * - either:
 *   - info.blockName, if provided, or
 *   - info.funcName, with every instance of '[A-Z]+' replaced with '_[a-z]+'.
 *     For example, 'isPresent' would become 'is_present' and
 *     'getID' would become 'get_id'.
 * @param {string} prefix A ComputerCraft API prefix, such as 'os'.
 * @param {Object} func An object containing a funcName field and optionally
 *     a blockName
 * @return {string} An underscore-separated string suitable for use as a block
 *     name.
 */
Blockly.ComputerCraft.getBlockName_ = function(prefix, info) {
  var name = info.blockName;
  var inCapital = false;
  if (!name) {
    name = '';
    for (var i = 0; i < info.funcName.length; i++) {
      var c = info.funcName[i];
      if (Blockly.ComputerCraft.CAPITAL_LETTER_REGEX_.test(c)) {
        // Only place one underscore for multiple adjacent capital letters.
        if (!inCapital) {
          inCapital = true;
          name += '_';
        }
      } else {
        inCapital = false;
      }
      name += c.toLowerCase();
    }
  }
  return prefix + '_' + name;
}

/**
 * Base class for ComputerCraft blocks.
 *
 * This is used directly in creating blocks, and it is extended by
 * Blockly.ComputerCraft.ExpStmtBlock and Blockly.ComputerCraft.ValueBlock.
 *
 * @param {string} prefix A ComputerCraft API name, such as 'turtle'.
 * @param {number} colour The block colour, an HSV hue value.
 * @param {Object} info Information about the block being defined.
 *     The following fields are used:
 *     <ul>
 *     <li>blockName {?string} The Blockly name of the block (once the prefix
 *         is added, such as 'turtle_turn'.  If not provided, this is inferred
 *         from funcName via Blockly.ComputerCraft.getBlockName_().
 *     <li>funcName {?string} The name of the Lua function generated by this
 *         block.  This must be provided if blockName is not.
 *     <li>ddFuncName {?string} The name of the dropdown menu whose value gives
 *         the function name.  Set to false to use funcName instead.  If set,
 *         the dropdown value will not separately be used as a parameter.
 *     <li>output {?string|Array.<string>} Type(s) of the first output.
 *         If absent, there are assumed to be no outputs.
 *     <li>stmtConns {?Blockly.ComputerCraft.StmtConns}
 *         Whether there are previous and next statements.
 *         If absent and if there is no output, it will be assumed
 *         that there are previous and next statement connections
 *     <li>multipleOutputs {?number} The number of outputs, if greater than 1.
 *     <li>parameterOrder {?Array.<string>} An ordered list of the names of
 *         inputs to use as parameters.  If not provided, all value and
 *         dropdown inputs will be used in order.
 *     <li>quoteDropdownValues {?boolean} Indicates whether dropdown values
 *         should be quoted when used as parameters.  This defaults to true.
 *     <li>tooltip {?string} Tooltip text.
 *     <li>helpUrl {?string} The help URL, accessible through the context menu.
 *         This may also be specified through helpUrlType.
 *     <li>helpUrlType {?Blockly.ComputerCraft.HelpUrlType} How to create the
 *         help URL, as a function of other fields.  This is ignored if
 *         helpUrl is provided.
 *     </ul>
 */
Blockly.ComputerCraft.Block = function(prefix, colour, info) {
  this.prefix = prefix;
  this.colour = colour;
  this.info = info;
  this.blockName = Blockly.ComputerCraft.getBlockName_(prefix, info);
};

Blockly.ComputerCraft.Block.prototype.init = function() {
  this.setColour(this.colour);
  this.setInputsInline(true);
  if (this.info.helpUrlType ==
      Blockly.ComputerCraft.HelpUrlType.PREFIX_NAME) {
      this.helpUrl =
        Blockly.ComputerCraft.BASE_HELP_URL +
            this.prefix.charAt(0).toUpperCase() +
            this.prefix.slice(1) + '.' + this.info.funcName;
  }
  if (this.info.tooltip) {
    this.setTooltip(this.info.tooltip);
  }
  // If no output or statement connections are specified,
  // place a previous and next statement connector.
  if (!this.info.multipleOutputs && !this.info.output &&
      this.info.stmtConns != Blockly.ComputerCraft.StmtConns.NONE) {
    this.info.stmtConns = Blockly.ComputerCraft.StmtConns.BOTH;
  }
  if (this.info.stmtConns) {
    this.setPreviousStatement(
      (this.info.stmtConns & Blockly.ComputerCraft.StmtConns.PREVIOUS) != 0);
    this.setNextStatement(
      (this.info.stmtConns & Blockly.ComputerCraft.StmtConns.NEXT) != 0);
  }
  if (this.info.output) {
    this.setOutput(true, this.info.output);
  }
  if (this.info.multipleOutputs) {
    this.multipleOutputs = this.info.multipleOutputs;
    if (!this.info.output) {
      this.setOutput(true);
    }
  }
  // Subclass must set up inputs, including block title.
};

// This is a static method that must be called explicitly.
// It generates Lua without worrying about whether it will be an expression
// or statement.
// To avoid code duplication, it violates abstraction by supporting all of the
// direct subclasses of Blockly.ComputerCraft.Block.
Blockly.ComputerCraft.generateLuaInner_ = function(block) {
  function fieldIsDropdown(field) {
    return field instanceof Blockly.FieldDropdown;
  };
  var code = block.prefix + '.';

  if (block.info.ddFuncName) {
    code += block.getTitleValue(block.info.ddFuncName) + '(';
  } else {
    code += block.info.funcName + '(';
  }
  if (block.info.parameterOrder) {
    // If the client provided an ordered list of parameters, use it.
    var args = block.info.parameterOrder.map(
      function(name) {
        return Blockly.Block.prototype.getInput.call(block, name);
        });
  } else {
    // Otherwise, select among the non-dummy inputs.
    var args = block.inputList.filter(function(i) {
      // NOTE: This only supports value and dropdown inputs.
      return i.type == Blockly.INPUT_VALUE ||
          (i.type == Blockly.DUMMY_INPUT && i.titleRow.some(fieldIsDropdown) &&
           // Ignore dropdown menus if they provide the Lua function name
           !block.info.ddFuncName &&
           // Ignore dropdown menus if they are the controlling input of
           // a BlockWithDependentInput and the input is being shown.
           !(i.name == block.info.ddName && block.dependentInputShown));
    });
  }
  var argsCode = args.map(function(i) {
    if (i.type == Blockly.INPUT_VALUE) {
      return Blockly.Lua.valueToCode(
        block, i.name, Blockly.Lua.ORDER_NONE);
    } else {
      // Find the dropdown menu input.
      var dropdowns = i.titleRow.filter(fieldIsDropdown);
      if (dropdowns.length != 1) {
        window.alert('Error generating code for: ' + block);
        return '';
      }
      if (block.info.quoteDropdownValues ||
          typeof block.info.quoteDropdownValues == 'undefined') {
        return "'" + dropdowns[0].value_ + "'";  // abstraction violation
      } else {
        return dropdowns[0].value_ ;  // abstraction violation
      }
    }
  });
  code += argsCode.join(', ');
  code += ')';
  return code;
};

// This is a static method that must be called explicitly.
Blockly.ComputerCraft.generateLua = function(block) {
  var code = Blockly.ComputerCraft.generateLuaInner_(block);
  if (block.outputConnection) {
    return [code, Blockly.Lua.ORDER_HIGH];
  } else {
    return code + '\n';
  }
};

/**
 * Class for ComputerCraft blocks that can switch between being expressions
 * and statements.  These are all assumed to have a Boolean first output
 * and a second (String) output.
 *
 * @param {string} prefix A ComputerCraft API name, such as 'turtle'.
 * @param {number} colour The block colour, an HSV hue value.
 * @param {Object} info Information about the block being defined.
 *     In addition to the fields used for the parent class
 *     Blockly.ComputerCraft.Block:
 *     <ul>
 *     <li>directions {?Array.<Array.<string>>} An array of tuples used to
 *         create a dropdown menu.  The first element of each tuple is the
 *         displayed text; the second element is the internal name, usually
 *         the name of a Lua function.
 *     </ul>
 * @return {Blockly.ComputerCraft.ExpStmtBlock} The new block.
 */
Blockly.ComputerCraft.ExpStmtBlock = function(prefix, colour, info) {
  Blockly.ComputerCraft.Block.call(this, prefix, colour, info);
  info.output = 'Boolean';
  info.multipleOutputs = 2;
};

/**
 * Static factory method for Blockly.ComputerCraft.ExpStmtBlock.  This
 * creates and adds to the namespace the block definition and, optionally,
 * a Lua code generator.
 * @param {string} prefix A ComputerCraft API name, such as 'turtle'.
 * @param {number} colour The block colour, an HSV hue value.
 * @param {Object} info Information about the block being defined.
 *     In addition to the fields used by the Blockly.ComputerCraft.ExpStmtBlock
 *     constructor, this has:
 *     <ul>
 *     <li>suppressLua {boolean} If true, no Lua code generator is created.
 *     </ul>
 */
Blockly.ComputerCraft.buildExpStmtBlock = function(prefix, colour, info) {
  var newBlock = new Blockly.ComputerCraft.ExpStmtBlock(prefix, colour, info);
  Blockly.Blocks[newBlock.blockName] = newBlock;
  if (!newBlock.suppressLua) {
    Blockly.Lua[newBlock.blockName] = function(block) {
      var code = block.prefix + '.';
      if (block.info.directions) {
        code += block.getTitleValue('DIR') + '(';
      } else {
        code += block.info.funcName + '(';
      }
      var args = block.inputList.filter(function(i) {
        return i.type == Blockly.INPUT_VALUE;}).
          map(function(i) {
            return Blockly.Lua.valueToCode(
              block, i.name, Blockly.Lua.ORDER_NONE);
          });
      code += args.join(', ');
      code += ')';
      return Blockly.ComputerCraft.ExpStmtBlock.prototype.adjustCode.call(
        block, code);
    }
  }
};

Blockly.ComputerCraft.ExpStmtBlock.prototype.init = function() {
  Blockly.ComputerCraft.Block.prototype.init.call(this);
  if (this.info.directions) {
    this.appendDummyInput('DIRECTIONS')
        .appendTitle(new Blockly.FieldDropdown(this.info.directions), 'DIR');
  }
  if (this.info.helpUrlType ==
      Blockly.ComputerCraft.HelpUrlType.PREFIX_DIR) {
    var thisBlock = this;
    this.setHelpUrl(function() {
      return Blockly.ComputerCraft.BASE_HELP_URL +
            thisBlock.prefix.charAt(0).toUpperCase() +
            thisBlock.prefix.slice(1) + '.' + thisBlock.getTitleValue('DIR');
    });
  }
};

Blockly.ComputerCraft.ExpStmtBlock.prototype.changeModes =
    function(shouldBeStatement) {
  this.unplug(true, true);
  if (shouldBeStatement) {
    this.setOutput(false);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.isStatement = true;
  } else {
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setOutput(true);
    this.isStatement = false;
  }
};

Blockly.ComputerCraft.ExpStmtBlock.prototype.customContextMenu =
    function(options) {
  var option = {enabled: true};
  option.text = this.isStatement ? 'Add Output' : 'Remove Output';
  var thisBlock = this;
  option.callback = function() {
    thisBlock.changeModes(!thisBlock.isStatement);
  };
  options.push(option);
};

Blockly.ComputerCraft.ExpStmtBlock.prototype.mutationToDom = function() {
  // Save whether it is a statement.
  var container = document.createElement('mutation');
  container.setAttribute('is_statement', this['isStatement'] || false);
  return container;
};

Blockly.ComputerCraft.ExpStmtBlock.prototype.domToMutation
    = function(xmlElement) {
  this.changeModes(xmlElement.getAttribute('is_statement') == 'true');
};

Blockly.ComputerCraft.ExpStmtBlock.prototype.adjustCode = function(code) {
  if (this.isStatement) {
    return code + '\n';
  } else {
    return [code, Blockly.Lua.ORDER_HIGH];
  }
};

/**
 * Class for ComputerCraft blocks whose inputs, if any, are all value inputs.
 *
 * @param {string} prefix A ComputerCraft API name, such as 'turtle'.
 * @param {number} colour The block colour, an HSV hue value.
 * @param {Object} info Information about the block being defined.
 *     In addition to the fields used for the parent class
 *     Blockly.ComputerCraft.Block, there are:
 *     <ul>
 *     <li>text {!string} Block text, suitable for passing to
 *         Blockly.Block.prototype.interpolateMsg.apply(this, interpArgs);
 *     <li>args {?Array.<Array.<string>>} A series of tuples describing
 *         the value inputs.  The first element of each tuple it its name,
 *         the second its type (which may be null).
 *     </ul>
 * @return {Blockly.ComputerCraft.ExpStmtBlock} The new block.
 */
Blockly.ComputerCraft.ValueBlock = function(prefix, colour, info) {
  Blockly.ComputerCraft.Block.call(this, prefix, colour, info);
}

Blockly.ComputerCraft.ValueBlock.prototype.init = function(opt_args) {
  Blockly.ComputerCraft.Block.prototype.init.call(this);
  // Build up arguments to the format expected by interpolateMsg.
  var interpArgs = []
  interpArgs.push(this.info.text);
  var args = opt_args || this.info.args;
  if (args) {
    for (var j = 0; j < args.length; j++) {
      var arg = [];
      arg.push(args[j][0]);  // name
      // The next argument is either a type (expressed as a string) for a
      // value input, or a Blockly.FieldDropdown.
      if (args[j] instanceof Blockly.FieldDropdown) {
        var dd = new Blockly.FieldDropdown(
          args[j][1].menuGenerator_, args[j][1].changeHandler_);
        dd.prefixTitle = args[j][1].prefixTitle;
        dd.suffixTitle = args[j][1].suffixTitle;
        arg.push(dd);
      } else {
        arg.push(args[j][1]);
      }
      arg.push(Blockly.ALIGN_RIGHT);
      interpArgs.push(arg);
    }
  }
  interpArgs.push(Blockly.ALIGN_RIGHT);
  Blockly.Block.prototype.interpolateMsg.apply(this, interpArgs);
}

/**
 * Create a block whose inputs, if any, are all value inputs.  This
 * also creates a Lua code generator.
 *
 * @param {!string} prefix A lower-case prefix corresponding to a
 *     ComputerCraft API, such as "os".
 * @param {number} colour The block's colour.
 * @param {!Object} info Information about the block being defined.
 *     This adds no fields to the ones used by the constructor
 *     Blockly.ComputerCraft.ValueBlock.
 */
Blockly.ComputerCraft.buildValueBlock = function(prefix, colour, info) {
  info.helpUrlType = Blockly.ComputerCraft.HelpUrlType.PREFIX_NAME;
  var newBlock = new Blockly.ComputerCraft.ValueBlock(prefix, colour, info);
  Blockly.Blocks[newBlock.blockName] = newBlock;
  Blockly.Lua[newBlock.blockName] = Blockly.ComputerCraft.generateLua;
};

Blockly.ComputerCraft.InputAddType = {
  NONE: 0,  // Later code assumes that NONE is 0, so do not change.
  FIRST: 1,
  ALL: 2
};

/**
 * Class for ComputerCraft blocks that have an input that only appears if
 * a dropdown menu has a specific value.  This specific value must not be
 * the default first option.
 *
 * While additional inputs not included in info.args or referenced in info.text
 * may be added, those fields musta not be modified after block construction.
 *
 * @param {string} prefix A ComputerCraft API name, such as 'turtle'.
 * @param {number} colour The block colour, an HSV hue value.
 * @param {Object} info Information about the block being defined.
 *     In addition to the fields used for the parent class
 *     Blockly.ComputerCraft.ValueBlock:
 *     <ul>
 *     <li>ddTitle {!string} Name of dropdown that controls whether
 *         dependent value input appears.
 *     <li>ddValue {!string} Value of dropdown when dependent value input
 *         appears.  This must not be the first option.
 *     <li>depName {!string} Name of dependent value input.
 *     <li>depType {?Array.<string>|string} Type of dependent value input.
 *     <li>depTitle {?string} Optional text to appear before dependent input
 *         only when it is shown.
 *     <li>addChild {?Blockly.ComputerCraft.InputAddTypes} Whether to
 *         automatically add and attach an input block when the dependent input
 *         is added.  This can only be done if depType is 'String' or 'Number'.
 *     </ul>
 * @return {Blockly.ComputerCraft.BlockWithDependentInput} The new block.
 */
Blockly.ComputerCraft.BlockWithDependentInput = function(prefix, colour, info) {
  // Initially, all of the inputs will appear.
  Blockly.ComputerCraft.ValueBlock.call(this, prefix, colour, info);
}

Blockly.ComputerCraft.BlockWithDependentInput.DD_MARKER = '*';
Blockly.ComputerCraft.BlockWithDependentInput.DEP_MARKER = '^';

/**
 * Sets the following attributes on the argument:
 * - ddName: The name of the dropdown that controls the dependent input.
 *   This is determined by finding which input name ends with the character
 *   DD_MARKER.
 * - ddValue: The value of the dropdown that indicates that the dependent input
 *   should be enabled.  This is determined by finding which dropdown value
 *   ends with the character DD_MARKER.
 * - depName: The name of the dependent input.  This is determined by finding
 *   which input name ends with the character DEP_MARKER.
 * - depType: The type of the dependent Input.  This is determined by the type
 *   associated with depName.
 *
 * This method has no effect if info.ddName or info.depName is already defined
 * (besides asserting that, if one is set, both are).
 *
 * This mutates info.args, so be careful not to share this field (unless
 * info.ddName and info.depName are already defined).
 *
 * @param {!object} info An object with an args attribute whose value is an
 *   array of two-element tuples.  Each tuple represents an input.  The first
 *   element of each tuple is a string giving the input name.  The second
 *   element is either a string describing a type (such as 'String' or 'Number')
 *   or an array of dropdown choices: two-element tuples where the first element
 *   is the displayed string and the second element the language-independent
 *   value. The name of one dropdown menu input should end with DD_MARKER, as
 *   should the name of whichever of the dropdown menu's values enables the
 *   dependent input.  Similarly, the name of the dependent input should end
 *   with DEP_MARKER.  These markers are stripped off.  It is an error for
 *   more than one input to have a DD_MARKER or for more than one to have a
 *   DEP_MARKER.  It is acceptable to have neither.
 */
Blockly.ComputerCraft.BlockWithDependentInput.setDependenceInfo_ =
    function(info) {
      // Skip if the attributes have already been defined.
      if (!info.ddName && !info.depName) {
        // Define short names for convenience and code clarity.
        var ddMarker = Blockly.ComputerCraft.BlockWithDependentInput.DD_MARKER;
        var depMarker = Blockly.ComputerCraft.BlockWithDependentInput.DEP_MARKER;
        for (var i = 0; i < info.args.length; i++) {
          var arg = info.args[i];
          var name = arg[0];
          if (name) {
            if (name.charAt(name.length - 1) == ddMarker) {
              goog.asserts.assert(!info.ddName,
                'info.ddName is being redefined.');
              arg[0] = name.slice(0, -1);
              info.ddName = arg[0];
              for (var j = 0; j < arg[1].length; j++) {
                var choice = arg[1][j];
                var choiceName = choice[1];
                if (choiceName.charAt(choiceName.length - 1) == ddMarker) {
                  goog.asserts.assert(!info.ddValue,
                    'info.ddValue is being redefined.');
                  choice[1] = choiceName.slice(0, -1);
                  info.ddValue = choice[1];
                }
              }
              goog.asserts.assert(info.ddValue,
                'No enabling value was found in dropdown ', info.ddName);
            } else if (name.charAt(name.length - 1) == depMarker) {
              goog.asserts.assert(!info.depName,
                'info.depName is being redefined.');
              arg[0] = name.slice(0, -1);
              info.depName = arg[0];
              goog.asserts.assert(typeof arg[1] == 'string',
                'Dependent inputs must be simple types.');
              info.depType = arg[1];
            }
          }
        }
      }

      // Validate the attributes, even if we didn't modify them.
      if (info.ddName) {
        goog.asserts.assert(info.depName,
          'A controlling dropdown menu was defined but not a dependent input.');
      } else {
        goog.assert.assert(!info.depName,
          'A dependent input was defined but not a controlling dropdown menu.');
      }
    };

/**
 * Create a block whose inputs that has a "dependent" value input that is only
 * shown if an associated dropdown menu has a certain value.
 *
 * There are two ways to specify the connection between the dropdown menu and
 * the dependent input.  The first is to define the ddName, ddValue, depName,
 * and depValue attributes of info, as described in the constructor above.
 * The second, more compact, way is to mark the dropdown input, the choice
 * that controls the dependent input, and the dependent input, as described
 * in setDependenceInfo_() above.  Because that method mutates info, be
 * careful not to pass in shared data (specifically, dropdown menu descriptions).
 *
 * This method also creates a Lua code generator.
 *
 * @param {!string} prefix A lower-case prefix corresponding to a
 *     ComputerCraft API, such as "os".
 * @param {number} colour The block's colour.
 * @param {!Object} info Information about the block being defined.
 *     This adds no fields to the ones used by the constructor
 *     Blockly.ComputerCraft.BlockWithDependentInput.
 */
Blockly.ComputerCraft.buildBlockWithDependentInput = function(
  prefix, colour, info) {
  Blockly.ComputerCraft.BlockWithDependentInput.setDependenceInfo_(info);
  var newBlock = new Blockly.ComputerCraft.BlockWithDependentInput(
    prefix, colour, info);
  Blockly.Blocks[newBlock.blockName] = newBlock;
  Blockly.Lua[newBlock.blockName] = Blockly.ComputerCraft.generateLua;
};

Blockly.ComputerCraft.BlockWithDependentInput.prototype.init = function() {
  // Create the dropdown inputs without mutating args.
  // That way, init() can be rerun without error.
  var args = []
  for (var i = 0; i < this.info.args.length; i++) {
    var tuple = this.info.args[i];
    if (typeof tuple[1] == 'string') {
      args.push(tuple);
      if (tuple[0] == this.info.depName &&
          this.info.text.indexOf('%0') == -1) {
        // This mutates this.info.text if it has not yet been mutated
        // to add a dummy input and the dependent input's title before the
        // dependent input.
        var re = new RegExp('%' + (i + 1) + '(?=(\\D|$))');
        var sub = '%0 ' + (this.info.depTitle || '') + ' %' + (i + 1);
        this.info.text = this.info.text.replace(re, sub);
      }
    } else {
      var newTuple = []
      newTuple[0] = tuple[0];
      // Current tuple represents a dropdown menu.
      if (newTuple[0] == this.info.ddName) {
        // It's the input that controls the dependent input.
        var thisBlock = this;
        newTuple[1] = new Blockly.FieldDropdown(
          tuple[1],
          function(value) {
            if (value == thisBlock.info.ddValue) {
              if (!thisBlock.dependentInputShown) {
                Blockly.ComputerCraft.
                    BlockWithDependentInput.showDependentInput_(thisBlock, true);
              }
            } else {
              if (thisBlock.dependentInputShown) {
                Blockly.ComputerCraft.
                    BlockWithDependentInput.removeDependentInput_(thisBlock);
              }
            }
          });
      } else {
        // It's another dropdown menu.
        newTuple[1] = new Blockly.FieldDropdown(tuple[1]);
      }
      args.push(newTuple);
    }
  }
  // This will call interpolateMsg.
  Blockly.ComputerCraft.ValueBlock.prototype.init.call(this, args);

  // Determine the position of the dependent input so it can be reinserted
  // in the same place when needed.  Note that inputs may be added (or removed)
  // after it, but it is not permitted to remove earlier inputs.
  for (var i = 0; i < this.inputList.length; i++) {
    if (this.inputList[i].name == this.info.depName) {
      this.depPos = i;
    }
  }
  goog.asserts.assert(
    typeof this.depPos == 'number',
    'Dependent input ' + this.info.depName + ' could not be found.');

  // Check whether the dependent input should be removed.
  if (this.getTitleValue(this.info.ddName) == this.info.ddValue) {
    this.dependentInputShown = true;
  } else {
    Blockly.ComputerCraft.BlockWithDependentInput.removeDependentInput_(this);
  }
};

// Show the dependent input.  The argument permitChild determines whether
// to examine block.info.addChild and consider creating a child input.
// This is needed to prevent the child from being created twice when
// this is called from domToMutation.
Blockly.ComputerCraft.BlockWithDependentInput.showDependentInput_ =
    function(block, permitChild) {
      // Create dependent input, and put it into position.
      var depInput = block.appendValueInput(block.info.depName)
          .setCheck(block.info.depType);
      if (block.info.depTitle) {
        depInput.appendTitle(block.info.depTitle);
      }
      if (block.depPos != block.inputList.length - 1) {
        block.moveNumberedInputBefore(block.inputList.length - 1, block.depPos);
      }

      // Check if we should create a child block.
      if (permitChild && block.info.addChild) {
        goog.asserts.assert(
          block.info.depType == 'String' || block.info.depType == 'Number',
          'When addChild is true, depType must be String or Number, not ' +
          block.info.depType);
        var childBlock = new Blockly.Block(
          block.workspace,
          block.info.depType == 'String' ? 'text' : 'math_number');
        childBlock.initSvg();
        childBlock.render();
        depInput.connection.connect(childBlock.outputConnection);
        if (block.info.addChild == Blockly.ComputerCraft.InputAddType.FIRST) {
          block.info.addChild = Blockly.ComputerCraft.InputAddType.NONE;
        }
      }

      block.dependentInputShown = true;
    };

Blockly.ComputerCraft.BlockWithDependentInput.removeDependentInput_ =
    function(block) {
      block.removeInput(block.info.depName);
      block.dependentInputShown = false;
    };

Blockly.ComputerCraft.BlockWithDependentInput.prototype.mutationToDom =
    function() {
      var container = document.createElement('mutation');
      container.setAttribute('dependent_input', this.dependentInputShown);
      container.setAttribute('add_child', this.info.addChild);
      return container;
    };

Blockly.ComputerCraft.BlockWithDependentInput.prototype.domToMutation =
    function(xmlElement) {
      var value = xmlElement.getAttribute('dependent_input') ||
          // Included for backward compatability.
          xmlElement.getAttribute('cable_mode');
      if (value == 'true' && !this.dependentInputShown) {
        Blockly.ComputerCraft.BlockWithDependentInput.showDependentInput_(
          this, false);
      }
      value = xmlElement.getAttribute('add_child');
      if (value) {
        this.info.addChild = parseInt(value);
      }
    };

/**
 * Class for ComputerCraft blocks with a 'side' input (one of 'front', 'back',
 * 'left', 'right', 'top', 'bottom', or an arbitrary string identifying a
 * cable).  The block may also have both earlier inputs, provided through
 * info.text and info.args, and later inputs.  If an input is added after
 * the block is constructed, the method inputAdded() must be called.
 *
 * The side input and the dependent string input will be added on to the
 * end of the provided inputs, mutating the text and args arguments.  They
 * are named SIDE and CABLE, respectively.
 *
 * A question mark will be automatically added to the end of the block name if
 * the output (as specified in the 'info' parameter) is Boolean.
 *
 * @param {string} prefix A ComputerCraft API name, such as 'turtle'.
 * @param {number} colour The block colour, an HSV hue value.
 * @param {Object} info Information about the block being defined.
 *     The same fields are used as in the constructor of the parent class,
 *     Blockly.ComputerCraft.BlockWithDependentInput.  Notes:
 * @return {Blockly.ComputerCraft.BlockWithSide} The new block.
 */
Blockly.ComputerCraft.BlockWithSide = function(prefix, colour, info) {
  Blockly.ComputerCraft.BlockWithDependentInput.call(this, prefix, colour, info);
}

Blockly.ComputerCraft.BlockWithSide.SIDES_ =
    [['in front', 'front'],
     ['in back', 'back'],
     ['to the left', 'left'],
     ['to the right', 'right'],
     ['above', 'top'],
     ['below', 'bottom'],
     ['through cable...', 'cable']];

/**
 * Create a block that has a side input.
 *
 * @param {string} prefix A ComputerCraft API name, such as 'turtle'.
 * @param {number} colour The block colour, an HSV hue value.
 * @param {Object} info Information about the block being defined.
 *     In addition to the fields used by the Blockly.ComputerCraft.BlockWithSide
 *     constructor, this has:
 *     <ul>
 *     <li>suppressLua {boolean} If true, no Lua code generator is created.
 *     </ul>
 */
Blockly.ComputerCraft.buildBlockWithSide = function(prefix, colour, info) {
  if (!info.helpUrlType) {
    info.helpUrlType = Blockly.ComputerCraft.HelpUrlType.PREFIX_NAME;
  }
  if (!info.args) {
    info.args = [];
  }
  // Add SIDE and CABLE inputs to info.text.
  // A dummy input will be inserted in BlockWithDependentInput.init().
  info.text += ' %' + (info.args.length + 1) + ' %' + (info.args.length + 2);
  // Add SIDE and CABLE inputs to info.args.
  info.args.push(['SIDE', Blockly.ComputerCraft.BlockWithSide.SIDES_]);
  info.args.push(['CABLE', 'String']);

  // Explicitly set the dependent block attributes; otherwise, info.args will be
  // mutated in setDependenceInfo_().
  info.ddName = 'SIDE';    // This is the controlling dropdown menu.
  info.ddValue = 'cable';  // This is the value for showing the dependent input.
  info.depName = 'CABLE';  // This is the dependent input.
  info.depType = 'String';
  // Only create a child string the first time the dependent input is shown.
  info.addChild = Blockly.ComputerCraft.InputAddType.FIRST;

  // Add question mark at end of text if the block is a predicate.
  if (info.output == 'Boolean') {
    info.text += '?';
  };

  // Build block.
  var newBlock = new Blockly.ComputerCraft.BlockWithSide(prefix, colour, info);
  Blockly.Blocks[newBlock.blockName] = newBlock;
  if (!info.suppressLua) {
    Blockly.Lua[newBlock.blockName] = Blockly.ComputerCraft.generateLua;
  }
};

Blockly.ComputerCraft.BlockWithSide.prototype.init = function() {
  Blockly.ComputerCraft.BlockWithDependentInput.prototype.init.call(this);
};

Blockly.ComputerCraft.BlockWithSide.prototype.domToMutation =
    Blockly.ComputerCraft.BlockWithDependentInput.prototype.domToMutation;
Blockly.ComputerCraft.BlockWithSide.prototype.mutationToDom =
    Blockly.ComputerCraft.BlockWithDependentInput.prototype.mutationToDom;
