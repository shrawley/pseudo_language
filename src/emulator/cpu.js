app.service('cpu', ['opcodes', 'memory', function(opcodes, memory) {
    var cpu = {
        step: function() {
            var self = this;

            if (self.fault === true) {
                throw "FAULT. Reset to continue.";
            }

            try {
                var checkGPR = function(reg) {
                    if (reg < 0 || reg >= self.gpr.length) {
                        throw "Invalid register: " + reg;
                    } else {
                        return reg;
                    }
                };

                var checkGPR_SP = function(reg) {
                    if (reg < 0 || reg >= 1 + self.gpr.length) {
                        throw "Invalid register: " + reg;
                    } else {
                        return reg;
                    }
                };

                var setGPR_SP = function(reg,value)
                {
                    if(reg >= 0 && reg < self.gpr.length) {
                        self.gpr[reg] = value;
                    } else if(reg == self.gpr.length) {
                        self.sp = value;

                        // Not likely to happen, since we always get here after checkOpertion().
                        if (self.sp < self.minSP) {
                            throw "Stack overflow";
                        } else if (self.sp > self.maxSP) {
                            throw "Stack underflow";
                        }
                    } else {
                        throw "Invalid register: " + reg;
                    }
                };

                var getGPR_SP = function(reg)
                {
                    if(reg >= 0 && reg < self.gpr.length) {
                        return self.gpr[reg];
                    } else if(reg == self.gpr.length) {
                        return self.sp;
                    } else {
                        throw "Invalid register: " + reg;
                    }
                };

                var checkOperation = function(value) {
                    self.zero = false;
                    self.carry = false;

                    if (value >= 256) {
                        self.carry = true;
                        value = value % 256;
                    } else if (value === 0) {
                        self.zero = true;
                    } else if (value < 0) {
                        self.carry = true;
                        value = 256 - (-value) % 256;
                    }

                    return value;
                };

                var jump = function(newIP) {
                    if (newIP < 0 || newIP >= memory.data.length) {
                        throw "IP outside memory";
                    } else {
                        self.ip = newIP;
                    }
                };

                var push = function(value) {
                    memory.store(self.sp--, value);
                    if (self.sp < self.minSP) {
                        throw "Stack overflow";
                    }
                };

                var pop = function() {
                    var value = memory.load(++self.sp);
                    if (self.sp > self.maxSP) {
                        throw "Stack underflow";
                    }

                    return value;
                };

                var division = function(divisor) {
                    if (divisor === 0) {
                        throw "Division by 0";
                    }

                    return Math.floor(self.gpr[0] / divisor);
                };

                if (self.ip < 0 || self.ip >= memory.data.length) {
                    throw "Instruction pointer is outside of memory";
                }

                var regTo, regFrom, memFrom, memTo, number;
                var instr = memory.load(self.ip);
                switch(instr) {
                    case opcodes.NONE:
                        return false; // Abort step
                    case opcodes.CP_NUMBER_TO_ADDRESS:
                        memTo = memory.load(++self.ip);
                        number = memory.load(++self.ip);
                        memory.store(memTo, number);
                        self.ip++;
                        break;
                    case opcodes.CP_ADDRESS_TO_ADDRESS:
                        memTo = memory.load(++self.ip);
                        memFrom = memory.load(++self.ip);
                        memory.store(memTo, memFrom);
                        self.ip++;
                        break;
                    case opcodes.ADD_NUMBER_TO_ADDRESS: //TODO: continue here
                        regTo = checkGPR_SP(memory.load(++self.ip));
                        number = memory.load(++self.ip);
                        setGPR_SP(regTo,checkOperation(getGPR_SP(regTo) + number));
                        self.ip++;
                        break;
                    case opcodes.ADD_ADDRESS_TO_ADDRESS:
                        regTo = checkGPR_SP(memory.load(++self.ip));
                        number = memory.load(++self.ip);
                        setGPR_SP(regTo,checkOperation(getGPR_SP(regTo) + number));
                        self.ip++;
                        break;
                    case opcodes.SUB_NUMBER_FROM_ADDRESS:
                        regTo = checkGPR_SP(memory.load(++self.ip));
                        number = memory.load(++self.ip);
                        setGPR_SP(regTo,checkOperation(getGPR_SP(regTo) - number));
                        self.ip++;
                        break;
                    case opcodes.SUB_ADDRESS_FROM_ADDRESS:
                        regTo = checkGPR_SP(memory.load(++self.ip));
                        number = memory.load(++self.ip);
                        setGPR_SP(regTo,checkOperation(getGPR_SP(regTo) - number));
                        self.ip++;
                        break;
                    case opcodes.INC_ADDRESS:
                        regTo = checkGPR_SP(memory.load(++self.ip));
                        setGPR_SP(regTo,checkOperation(getGPR_SP(regTo) + 1));
                        self.ip++;
                        break;
                    case opcodes.DEC_ADDRESS:
                        regTo = checkGPR_SP(memory.load(++self.ip));
                        setGPR_SP(regTo,checkOperation(getGPR_SP(regTo) - 1));
                        self.ip++;
                        break;
                    case opcodes.CMP_ADDRESS_WITH_ADDRESS:
                        regTo = checkGPR_SP(memory.load(++self.ip));
                        memFrom = memory.load(++self.ip);
                        checkOperation(getGPR_SP(regTo) - memory.load(memFrom));
                        self.ip++;
                        break;
                    case opcodes.CMP_NUMBER_WITH_ADDRESS:
                        regTo = checkGPR_SP(memory.load(++self.ip));
                        number = memory.load(++self.ip);
                        checkOperation(getGPR_SP(regTo) - number);
                        self.ip++;
                        break;
                    case opcodes.JMP_ADDRESS:
                        number = memory.load(++self.ip);
                        jump(number);
                        break;
                    case opcodes.JC_ADDRESS:
                        number = memory.load(++self.ip);
                        if (self.carry) {
                            jump(number);
                        } else {
                            self.ip++;
                        }
                        break;
                    case opcodes.JNC_ADDRESS:
                        number = memory.load(++self.ip);
                        if (!self.carry) {
                            jump(number);
                        } else {
                            self.ip++;
                        }
                        break;
                    case opcodes.JZ_ADDRESS:
                        number = memory.load(++self.ip);
                        if (self.zero) {
                            jump(number);
                        } else {
                            self.ip++;
                        }
                        break;
                    case opcodes.JNZ_ADDRESS:
                        number = memory.load(++self.ip);
                        if (!self.zero) {
                            jump(number);
                        } else {
                            self.ip++;
                        }
                        break;
                    default:
                        throw "Invalid op code: " + instr;
                }

                return true;
            } catch(e) {
                self.fault = true;
                throw e;
            }
        },
        reset: function() {
            var self = this;
            self.maxSP = 231;
            self.minSP = 0;

            self.gpr = [0, 0, 0, 0];
            self.sp = self.maxSP;
            self.ip = 0;
            self.zero = false;
            self.carry = false;
            self.fault = false;
        }
    };

    cpu.reset();
    return cpu;
}]);
