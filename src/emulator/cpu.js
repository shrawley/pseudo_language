app.service('cpu', ['opcodes', 'memory', function(opcodes, memory) {
    var cpu = {
        step: function() {
            var self = this;

            if (self.fault === true) {
                throw "FAULT. Reset to continue.";
            }

            try {
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
                        memFrom = memory.load(memory.load(++self.ip));
                        memory.store(memTo, memFrom);
                        self.ip++;
                        break;
                    case opcodes.ADD_NUMBER_TO_ADDRESS:
                        memTo = memory.load(++self.ip);
                        srcNum = memory.load(memTo);
                        number = memory.load(++self.ip);
                        memory.store(memTo, srcNum + number);
                        self.ip++;
                        break;
                    case opcodes.ADD_ADDRESS_TO_ADDRESS:
                        memTo = memory.load(++self.ip);
                        memFrom = memory.load(++self.ip);
                        srcNum = memory.load(memTo);
                        srcNum1 = memory.load(memFrom);
                        memory.store(memTo, srcNum + srcNum1);
                        self.ip++;
                        break;
                    case opcodes.SUB_NUMBER_FROM_ADDRESS:
                        memTo = memory.load(++self.ip);
                        destNum = memory.load(memTo);
                        number = memory.load(++self.ip);
                        memory.store(memTo, checkOperation(destNum - number));
                        self.ip++;
                        break;
                    case opcodes.SUB_ADDRESS_FROM_ADDRESS:
                        memTo = memory.load(++self.ip);
                        memFrom = memory.load(++self.ip);
                        number1 = memory.load(memTo);
                        number2 = memory.load(memFrom);
                        memory.store(memTo, checkOperation(number1 - number2));
                        self.ip++;
                        break;
                    case opcodes.INC_ADDRESS:
                        memTo = memory.load(++self.ip);
                        number = memory.load(memTo);
                        memory.store(memTo, ++number);
                        self.ip++;
                        break;
                    case opcodes.DEC_ADDRESS:
                        memTo = memory.load(++self.ip);
                        number = memory.load(memTo);
                        memory.store(memTo, --number);
                        self.ip++;
                        break;
                    case opcodes.CMP_ADDRESS_WITH_ADDRESS:
                        memTo = memory.load(++self.ip);
                        memFrom = memory.load(++self.ip);
                        number1 = memory.load(memTo);
                        number2 = memory.load(memFrom);
                        checkOperation(number1 - number2);
                        self.ip++;
                        break;
                    case opcodes.CMP_NUMBER_WITH_ADDRESS:
                        memTo = memory.load(++self.ip);
                        number1 = memory.load(memTo);
                        number2 = memory.load(++self.ip);
                        checkOperation(number1 - number2);
                        self.ip++;
                        break;
                    case opcodes.JP_ADDRESS:
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
                    case opcodes.JZ_ADDRESS:
                        number = memory.load(++self.ip);
                        if (self.zero) {
                            jump(number);
                        } else {
                            self.ip++;
                        }
                        break;
                    case opcodes.PRINT_DECIMAL://continue here, needs debug
                        addressFrom = memory.load(++self.ip);
                        number = memory.load(addressFrom);
                        addressTo = self.sp + 1;
                        memory.store(addressTo, number);
                        self.ip++;
                        break;
                    case opcodes.PRINT_STRING:
                        addressFrom = memory.load(++self.ip);
                        addressTo = self.sp + 1;
                        count = 0;
                        addr = addressFrom;
                        value = memory.load(addr++);
                        while (count < 24 && value > 0) {
                          ++count;
                          value = memory.load(addr++);
                        }
                        memory.copy(addressTo, addressFrom, count);
                        self.ip++;
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
