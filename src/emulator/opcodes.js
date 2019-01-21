app.service('opcodes', [function() {
    var opcodes = {
        NONE: 0,
        CP_ADDRESS_TO_ADDRESS: 1,
        CP_NUMBER_TO_ADDRESS: 2,
        ADD_ADDRESS_TO_ADDRESS: 3,
        ADD_NUMBER_TO_ADDRESS: 4,
        SUB_ADDRESS_FROM_ADDRESS: 5,
        SUB_NUMBER_FROM_ADDRESS: 6,
        INC_ADDRESS: 7,
        DEC_ADDRESS: 8,
        CMP_ADDRESS_WITH_ADDRESS: 9,
        JMP_ADDRESS: 10,
        JC_ADDRESS: 11,
        JNC_ADDRESS: 12,
        JZ_ADDRESS: 13,
        JNZ_ADDRESS: 14,
        PRINT_STRING: 15,
        PRINT_DECIMAL: 16
    };

    return opcodes;
}]);
