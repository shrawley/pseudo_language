app.service('memory', [function () {
    var memory = {
        data: Array(256),
        lastAccess: -1,
        load: function (address) {
            var self = this;

            if (address < 0 || address >= self.data.length) {
                throw "Memory access violation at " + address;
            }

            self.lastAccess = address;
            return self.data[address];
        },
        store: function (address, value) {
            var self = this;

            if (address < 0 || address >= self.data.length) {
                throw "Memory access violation at " + address;
            }

            self.lastAccess = address;
            self.data[address] = value;
        },
        copy: function (addressTo, addressFrom, count) {
            var self = this;

            if (addressTo < 0 || addressTo >= self.data.length || addressTo + count >= self.data.length) {
                throw "Memory access violation at " + addressTo;
            }
            else if (addressFrom < 0 || addressFrom >= self.data.length || addressFrom + count >= self.data.length) {
                throw "Memory access violation at " + addressFrom;
            }
            else if (addressFrom > addressTo && addressFrom < addressTo + count) {
                throw "Memory access violation at " + addressTo;
            }
            for (i = 0; i < count; ++i) {
              self.data[addressTo + i] = self.data[addressFrom + i];
            }
            self.lastAccess = addressTo + count;
        },
        copyString: function (addressTo, str) {
            var self = this;
            var count = str.length;
            if (addressTo < 0 || addressTo >= self.data.length || addressTo + count >= self.data.length) {
                throw "Memory access violation at " + addressTo;
            }
            for (i = 0; i < count; ++i) {
              self.data[addressTo + i] = self.data[addressFrom + i];
            }
            self.lastAccess = addressTo + count;
        },

        reset: function () {
            var self = this;

            self.lastAccess = -1;
            for (var i = 0, l = self.data.length; i < l; i++) {
                self.data[i] = 0;
            }
        }
    };

    memory.reset();
    return memory;
}]);
