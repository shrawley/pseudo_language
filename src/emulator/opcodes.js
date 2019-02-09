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
        CMP_NUMBER_WITH_ADDRESS: 10,
        JP_ADDRESS: 11,
        JC_ADDRESS: 12,
        JZ_ADDRESS: 13,
        PRINT_STRING: 14,
        PRINT_DECIMAL: 15
    };

    return opcodes;
}]);
