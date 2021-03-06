app.service('assembler', ['opcodes', function (opcodes) {
    return {
        go: function (input) {
            // Use https://www.debuggex.com/
            // Matches: "label: INSTRUCTION (["')OPERAND1(]"'), (["')OPERAND2(]"')
            // GROUPS:      1       2               3                    7
            var regex = /^[\t ]*(?:([.A-Za-z]\w*)[:])?(?:[\t ]*([A-Za-z]{2,4})(?:[\t ]+(\[(\w+((\+|-)\d+)?)\]|\".+?\"|\'.+?\'|[.A-Za-z0-9\+]\w*)(?:[\t ]*[,][\t ]*(\[(\w+((\+|-)\d+)?)\]|\".+?\"|\'.+?\'|[.A-Za-z0-9\+]\w*))?)?)?/;

            // Regex group indexes for operands
            var op1_group = 3;
            var op2_group = 7;

            // MATCHES: "(+|-)INTEGER"
            var regexNum = /^[-+]?[0-9]+$/;
            // MATCHES: "(.L)abel"
            var regexLabel = /^[.A-Za-z]\w*$/;
            // Contains the program code & data generated by the assembler
            var code = [];
            // Contains the mapping from instructions to assembler line
            var mapping = {};
            // Hash map of label used to replace the labels after the assembler generated the code
            var labels = {};
            // Hash of uppercase labels used to detect duplicates
            var normalizedLabels = {};

            // Split text into code lines
            var lines = input.split('\n');

            // Allowed formats: 200, 200d, 0xA4, 0o48, 101b
            var parseNumber = function (input) {
                if (input.slice(0, 2) === "0x") {
                    return parseInt(input.slice(2), 16);
                } else if (input.slice(0, 2) === "0o") {
                    return parseInt(input.slice(2), 8);
                } else if (input.slice(input.length - 1) === "b") {
                    return parseInt(input.slice(0, input.length - 1), 2);
                } else if (input.slice(input.length - 1) === "d") {
                    return parseInt(input.slice(0, input.length - 1), 10);
                } else if (regexNum.exec(input)) {
                    return parseInt(input, 10);
                } else {
                    throw "Invalid number format";
                }
            };

            // Allowed: Register, Label or Number; SP+/-Number is allowed for 'regaddress' type
            var parseRegOrNumber = function (input, typeReg, typeNumber) {
                var label = parseLabel(input);
                if (label !== undefined) {
                    return {type: typeNumber, value: label};
                } else {
                    var value = parseNumber(input);

                    if (isNaN(value)) {
                        throw "Not a " + typeNumber + ": " + value;
                    }
                    else if (value < 0 || value > 255)
                        throw typeNumber + " must have a value between 0-255";

                    return {type: typeNumber, value: value};
                }
            };

            var parseLabel = function (input) {
                return regexLabel.exec(input) ? input : undefined;
            };

            var getValue = function (input) {
                switch (input.slice(0, 1)) {
                    case '[': // [number] or [register]
                        var address = input.slice(1, input.length - 1);
                        return parseRegOrNumber(address, "regaddress", "address");
                    case '"': // "String"
                        var text = input.slice(1, input.length - 1);
                        var chars = [];

                        for (var i = 0, l = text.length; i < l; i++) {
                            chars.push(text.charCodeAt(i));
                        }

                        return {type: "numbers", value: chars};
                    case "'": // 'C'
                        var character = input.slice(1, input.length - 1);
                        if (character.length > 1)
                            throw "Only one character is allowed. Use String instead";

                        return {type: "number", value: character.charCodeAt(0)};
                    default: // REGISTER, NUMBER or LABEL
                        return parseRegOrNumber(input, "register", "number");
                }
            };

            var addLabel = function (label) {
                var upperLabel = label.toUpperCase();
                if (upperLabel in normalizedLabels)
                    throw "Duplicate label: " + label;

                labels[label] = code.length;
            };

            var checkNoExtraArg = function (instr, arg) {
                if (arg !== undefined) {
                    throw instr + ": too many arguments";
                }
            };

            for (var i = 0, l = lines.length; i < l; i++) {
                try {
                    var match = regex.exec(lines[i]);
                    if (match[1] !== undefined || match[2] !== undefined) {
                        if (match[1] !== undefined) {
                            addLabel(match[1]);
                        }

                        if (match[2] !== undefined) {
                            var instr = match[2].toUpperCase();
                            var p1, p2, opCode;

                            // Add mapping instr pos to line number
                            // Don't do it for DB as this is not a real instruction
                            if (instr !== 'DB') {
                                mapping[code.length] = i;
                            }

                            switch (instr) {
                                case 'DB':
                                    p1 = getValue(match[op1_group]);

                                    if (p1.type === "number")
                                        code.push(p1.value);
                                    else if (p1.type === "numbers")
                                        for (var j = 0, k = p1.value.length; j < k; j++) {
                                            code.push(p1.value[j]);
                                        }
                                    else
                                        throw "DB does not support this operand";

                                    break;
                                case 'CP':
                                    p1 = getValue(match[op1_group]);
                                    p2 = getValue(match[op2_group]);

                                    if (p1.type === "address" && p2.type === "number")
                                        opCode = opcodes.CP_NUMBER_TO_ADDRESS;
                                    else if (p1.type === "address" && p2.type === "address")
                                        opCode = opcodes.CP_ADDRESS_TO_ADDRESS;
                                    else
                                        throw "CP does not support this operands";

                                    code.push(opCode, p1.value, p2.value);
                                    break;
                                case 'CTP':
                                    p1 = getValue(match[op1_group]);
                                    p2 = getValue(match[op2_group]);

                                    if (p1.type === "address" && p2.type === "number")
                                        opCode = opcodes.CTP_NUMBER_TO_ADDRESS;
                                    else if (p1.type === "address" && p2.type === "address")
                                        opCode = opcodes.CTP_ADDRESS_TO_ADDRESS;
                                    else
                                        throw "CTP does not support this operands";

                                    code.push(opCode, p1.value, p2.value);
                                    break;
                                case 'CFP':
                                    p1 = getValue(match[op1_group]);
                                    p2 = getValue(match[op2_group]);

                                    if (p1.type === "address" && p2.type === "address")
                                        opCode = opcodes.CFP_ADDRESS_TO_ADDRESS;
                                    else
                                        throw "CFP does not support this operands";

                                    code.push(opCode, p1.value, p2.value);
                                    break;
                                case 'ADD':
                                    p1 = getValue(match[op1_group]);
                                    p2 = getValue(match[op2_group]);

                                    if (p1.type === "address" && p2.type === "address")
                                        opCode = opcodes.ADD_ADDRESS_TO_ADDRESS;
                                    else if (p1.type === "address" && p2.type === "number")
                                        opCode = opcodes.ADD_NUMBER_TO_ADDRESS;
                                    else
                                        throw "ADD does not support this operands";

                                    code.push(opCode, p1.value, p2.value);
                                    break;
                                case 'SUB':
                                    p1 = getValue(match[op1_group]);
                                    p2 = getValue(match[op2_group]);

                                    if (p1.type === "address" && p2.type === "address")
                                        opCode = opcodes.SUB_ADDRESS_FROM_ADDRESS;
                                    else if (p1.type === "address" && p2.type === "number")
                                        opCode = opcodes.SUB_NUMBER_FROM_ADDRESS;
                                    else
                                        throw "SUB does not support this operands";

                                    code.push(opCode, p1.value, p2.value);
                                    break;
                                case 'INC':
                                    p1 = getValue(match[op1_group]);
                                    checkNoExtraArg('INC', match[op2_group]);

                                    if (p1.type === "address")
                                        opCode = opcodes.INC_ADDRESS;
                                    else
                                        throw "INC does not support this operand";

                                    code.push(opCode, p1.value);

                                    break;
                                case 'DEC':
                                    p1 = getValue(match[op1_group]);
                                    checkNoExtraArg('DEC', match[op2_group]);

                                    if (p1.type === "address")
                                        opCode = opcodes.DEC_ADDRESS;
                                    else
                                        throw "DEC does not support this operand";

                                    code.push(opCode, p1.value);

                                    break;
                                case 'CMP':
                                    p1 = getValue(match[op1_group]);
                                    p2 = getValue(match[op2_group]);

                                    if (p1.type === "address" && p2.type === "address")
                                        opCode = opcodes.CMP_ADDRESS_WITH_ADDRESS;
                                    else if (p1.type === "address" && p2.type === "number")
                                        opCode = opcodes.CMP_NUMBER_WITH_ADDRESS;
                                    else
                                        throw "CMP does not support this operands";

                                    code.push(opCode, p1.value, p2.value);
                                    break;
                                case 'JP':
                                    p1 = getValue(match[op1_group]);
                                    checkNoExtraArg('JP', match[op2_group]);

                                    if (p1.type === "number")
                                        opCode = opcodes.JP_ADDRESS;
                                    else
                                        throw "JP does not support this operands";

                                    code.push(opCode, p1.value);
                                    break;
                                case 'JO':
                                    p1 = getValue(match[op1_group]);
                                    checkNoExtraArg(instr, match[op2_group]);

                                    if (p1.type === "number")
                                        opCode = opcodes.JC_ADDRESS;
                                    else
                                        throw instr + " does not support this operand";

                                    code.push(opCode, p1.value);
                                    break;
                                case 'JZ':
                                    p1 = getValue(match[op1_group]);
                                    checkNoExtraArg(instr, match[op2_group]);

                                    if (p1.type === "number")
                                        opCode = opcodes.JZ_ADDRESS;
                                    else
                                        throw instr + " does not support this operand";

                                    code.push(opCode, p1.value);
                                    break;
                                case 'PRND':
                                    p1 = getValue(match[op1_group]);
                                    checkNoExtraArg(instr, match[op2_group]);

                                    if (p1.type === "address")
                                        opCode = opcodes.PRINT_DECIMAL;
                                    else
                                        throw instr + " does not support this operand";

                                    code.push(opCode, p1.value);
                                    break;
                                case 'PRNS':
                                    p1 = getValue(match[op1_group]);
                                    checkNoExtraArg(instr, match[op2_group]);

                                    if (p1.type === "address")
                                        opCode = opcodes.PRINT_STRING;
                                    else
                                        throw instr + " does not support this operand";

                                    code.push(opCode, p1.value);
                                    break;
                                default:
                                    throw "Invalid instruction: " + match[2];
                            }
                        }
                    } else {
                        // Check if line starts with a comment otherwise the line contains an error and can not be parsed
                        var line = lines[i].trim();
                        if (line !== "" && line.slice(0, 1) !== ";") {
                            throw "Syntax error";
                        }
                    }
                } catch (e) {
                    throw {error: e, line: i};
                }
            }

            // Replace label
            for (i = 0, l = code.length; i < l; i++) {
                if (!angular.isNumber(code[i])) {
                    if (code[i] in labels) {
                        code[i] = labels[code[i]];
                    } else {

                        throw {error: "Undefined label: " + code[i]};
                    }
                }
            }

            return {code: code, mapping: mapping, labels: labels};
        }
    };
}]);
