
var currentValues = {};
var HomeyAPI = null;

function onHomeyReady(Homey){
    HomeyAPI = Homey;
    Homey.get('usebroker', function(err, usebroker) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('usebroker').value = usebroker;
        }
        if (typeof usebroker == 'undefined' || usebroker == null) usebroker = false;
        document.getElementById('usebroker').checked = usebroker;
        document.getElementById('serversettings').disabled = !usebroker;
        useBroker();
        currentValues.usebroker = usebroker;
    })

    Homey.get('url', function(err, url) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('url').value = url;
            currentValues.url = url;
        }
    })
    Homey.get('ip_port', function(err, ip_port) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('ip_port').value = ip_port;
            currentValues.ip_port = ip_port;
        }
    })
    Homey.get('tls', function(err, tls) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('tls').value = tls;
        }
        if (typeof tls == 'undefined' || tls == null) tls = false;
        document.getElementById('tls').checked = tls;
        currentValues.tls = tls;
    })
    Homey.get('selfsigned', function(err, selfsigned) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('selfsigned').value = tls;
        }
        if (typeof selfsigned == 'undefined' || selfsigned == null) selfsigned = false;
        document.getElementById('selfsigned').checked = selfsigned;
        currentValues.selfsigned = selfsigned;
    })

    Homey.get('keepalive', function(err, keepalive) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('keepalive').value = keepalive;
            currentValues.keepalive = keepalive;
        }
    })

    Homey.get('user', function(err, user) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('user').value = user;
            currentValues.user = user;
        }
    })
    Homey.get('password', function(err, password) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('password').value = password;
            currentValues.password = password;
        }
    })
    Homey.get('accuracy', function(err, accuracy) {
        if (err) {
            console.error(err)
        } else {
            if (typeof accuracy == 'undefined' || accuracy == null || accuracy =='') {
                currentValues.accuracy = accuracy;
                accuracy = '150';
                HomeyAPI.set('accuracy', accuracy);
            } else {
                currentValues.accuracy = accuracy;
            }
            document.getElementById('accuracy').value = accuracy;
        }
    })
    Homey.get('double_enter', function(err, double_enter) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('double_enter').value = double_enter;
        }
        if (typeof double_enter == 'undefined' || double_enter == null) double_enter = false;
        document.getElementById('double_enter').checked = double_enter;
        currentValues.double_enter = double_enter;
    })
    Homey.get('double_leave', function(err, double_leave) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('double_leave').value = double_leave;
        }
        if (typeof double_leave == 'undefined' || double_leave == null) double_leave = false;
        document.getElementById('double_leave').checked = double_leave;
        currentValues.double_leave = double_leave;
    })
    Homey.get('use_inregions', function(err, use_inregions) {
        if (err) {
            console.error(err)
        } else {
            document.getElementById('use_inregions').value = use_inregions;
        }
        if (typeof use_inregions == 'undefined' || use_inregions == null) use_inregions = false;
        document.getElementById('use_inregions').checked = use_inregions;
        currentValues.use_inregions = use_inregions;
    })

    createUserStatus();

    Homey.ready();
}

function save() {
    var oldValues = JSON.parse(JSON.stringify(currentValues));
    console.log(oldValues);
    var valuesHaveBeenChanged = false;

    if (currentValues.usebroker != document.getElementById('usebroker').checked) {
        console.log("usebroker has been changed");
        HomeyAPI.set('usebroker', document.getElementById('usebroker').checked);
        valuesHaveBeenChanged = true;
        currentValues.usebroker = document.getElementById('usebroker').checked;
    }

    if (currentValues.url != document.getElementById('url').value) {
        console.log("url has been changed");
        HomeyAPI.set('url', document.getElementById('url').value);
        valuesHaveBeenChanged = true;
        currentValues.url = document.getElementById('url').value;
    }

    if (currentValues.ip_port != document.getElementById('ip_port').value) {
        console.log("ip_port has been changed");
        HomeyAPI.set('ip_port', document.getElementById('ip_port').value);
        valuesHaveBeenChanged = true;
        currentValues.ip_port = document.getElementById('ip_port').value;
    }

    if (currentValues.tls != document.getElementById('tls').checked) {
        console.log("tls has been changed");
        HomeyAPI.set('tls', document.getElementById('tls').checked);
        valuesHaveBeenChanged = true;
        currentValues.tls = document.getElementById('tls').checked;
    }

    if (currentValues.selfsigned != document.getElementById('selfsigned').checked) {
        console.log("selfsigned has been changed");
        HomeyAPI.set('selfsigned', document.getElementById('selfsigned').checked);
        valuesHaveBeenChanged = true;
        currentValues.selfsigned = document.getElementById('selfsigned').checked;
    }

    if (currentValues.keepalive != document.getElementById('keepalive').value) {
        console.log("keepalive has been changed");
        HomeyAPI.set('keepalive', document.getElementById('keepalive').value);
        valuesHaveBeenChanged = true;
        currentValues.keepalive = document.getElementById('keepalive').value;
    }

    if (currentValues.user != document.getElementById('user').value) {
        console.log("user has been changed");
        HomeyAPI.set('user', document.getElementById('user').value);
        valuesHaveBeenChanged = true;
        currentValues.user = document.getElementById('user').value;
    }

    if (currentValues.password != document.getElementById('password').value) {
        console.log("password has been changed");
        HomeyAPI.set('password', document.getElementById('password').value);
        valuesHaveBeenChanged = true;
        currentValues.password = document.getElementById('password').value;
    }

    if (currentValues.accuracy != document.getElementById('accuracy').value) {
        console.log("accuracy has been changed");
        HomeyAPI.set('accuracy', document.getElementById('accuracy').value);
        valuesHaveBeenChanged = true;
        currentValues.accuracy = accuracy;
    }

    if (currentValues.double_enter != document.getElementById('double_enter').checked) {
        console.log("double_enter has been changed");
        HomeyAPI.set('double_enter', document.getElementById('double_enter').checked);
        valuesHaveBeenChanged = true;
        currentValues.double_enter = document.getElementById('double_enter').checked;
    }

    if (currentValues.double_leave != document.getElementById('double_leave').checked) {
        console.log("double_leave has been changed");
        HomeyAPI.set('double_leave', document.getElementById('double_leave').checked);
        valuesHaveBeenChanged = true;
        currentValues.double_leave = document.getElementById('double_leave').checked;
    }
    if (currentValues.use_inregions != document.getElementById('use_inregions').checked) {
        console.log("use_inregions has been changed");
        HomeyAPI.set('use_inregions', document.getElementById('use_inregions').checked);
        valuesHaveBeenChanged = true;
        currentValues.use_inregions = document.getElementById('use_inregions').checked;
    }

    if (valuesHaveBeenChanged == true) {
        notifySettings(oldValues);
        HomeyAPI.alert(__('settings.app.messages.settings_saved'));
    } else {
        HomeyAPI.alert(__('settings.app.messages.settings_noSettingsChanged'));
    }
}

function notifySettings(values) {
    HomeyAPI.api('POST', 'test/settingschange/', values, function(err, result) {
        if (!err) {
            console.log("Settings change succesfull");
        } else {
            // Oeps, something went wrong here
            HomeyAPI.alert(__('settings.app.messages.unable_set_settings'));
        }
    });
}

function purgeUserData() {
    // var resultConfirm = confirm(HomeyAPI.__('settings.app.data.data_purge_confirm'));
    HomeyAPI.confirm( HomeyAPI.__('settings.app.data.data_purge_confirm'), 'warning', function(err, result) {
        console.log(result);
        if (result == true) {
            HomeyAPI.api('GET', 'test/purgeUserData/', function(err, result) {
                console.log("err: " + err);
                console.log("result: "+result);
                if (!err) {
                    if (!result) {
                        console.log("Data has been purged");
                        HomeyAPI.alert(HomeyAPI__('settings.app.messages.data_purged'));
                    } else {
                        console.log("Purging failed");
                        HomeyAPI.alert(HomeyAPI.__('settings.app.messages.data_purged_failed'));
                    }
                } else {
                    console.log("Purging failed");
                    HomeyAPI.alert(HomeyAPI.__('settings.app.messages.data_purged_failed'));
                }
                console.log("End of purge GET");
            });
        }
        console.log("End of purgeUserData");
    })
}

function showLogLines() {
    //showUserArray();
    HomeyAPI.api('GET', 'test/getloglines/', function(err, result) {
        if (!err) {
            document.getElementById('loglines').innerHTML = '';
            for (var i=0; i < result.length; i++) {
                document.getElementById('loglines').innerHTML += result[i];
                document.getElementById('loglines').innerHTML += "<br />";
            }
        };
    });
}
/*
function showUserArray() {
    HomeyAPI.api('GET', 'test/getUserArray/', function(err, result) {
        if (!err) {
            document.getElementById('userdata').innerHTML = '';
            for (var i=0; i < result.length; i++) {
                document.getElementById('userdata').innerHTML += "Name: " + result[i].userName;
                document.getElementById('userdata').innerHTML += "   Fence: " + result[i].fence;
                document.getElementById('userdata').innerHTML += "   Lon: " + result[i].lon;
                document.getElementById('userdata').innerHTML += "   Lat: " + result[i].lat;
                document.getElementById('userdata').innerHTML += "<br />";
            }
        };
    });
} */

function isEven(n) {
    return n == parseFloat(n)? !(n%2) : void 0;
}

function createUserStatus() {
    var table = document.getElementById("userTable");
    document.getElementById("userTable").style.width = "50%";
    var nRows = table.rows.length;
    if (nRows > 0) {
        for (var i=0; i < nRows; i++) {
            table.deleteRow(-1);
        }
    }
    var header = table.createTHead();
    var rowhead = header.insertRow(0);
    var cellhead = rowhead.insertCell(0);
    var cellhead1 = rowhead.insertCell(1);
    var cellhead2 = rowhead.insertCell(2);
    var cellhead3 = rowhead.insertCell(3);
    var cellhead4 = rowhead.insertCell(4);
    var cellhead5 = rowhead.insertCell(5);
    cellhead.innerHTML = "<b>User</b>";
    cellhead1.innerHTML="<b>Fence</b>";
    cellhead2.innerHTML="<b>Lon</b>";
    cellhead3.innerHTML="<b>Lat</b>";
    cellhead4.innerHTML="<b>Battery</b>";
    cellhead5.innerHTML="<b>Device</b>";

    HomeyAPI.api('GET', 'test/getUserArray/', function(err, result) {
        if (!err) {
            for (var i=0; i < result.length; i++) {
                console.log("Create row for " + result[i].userName);
                var row = table.insertRow(-1);
                if (isEven(table.rows.length)) {
                    row.style.backgroundColor = "rgb(250,250,250)";
                }
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);
                var cell5 = row.insertCell(4);
                var cell6 = row.insertCell(5);
                if (currentValues.usebroker == true) {
                    var cell7 = row.insertCell(6);
                }
                cell1.innerHTML = result[i].name;
                cell2.innerHTML = result[i].devices[0].location.fence;
                cell3.innerHTML = result[i].devices[0].location.lon;
                cell4.innerHTML = result[i].devices[0].location.lat;
                cell5.innerHTML = result[i].devices[0].battery+"%";
                cell6.innerHTML = result[i].devices[0].name;
                if (currentValues.usebroker == true) {
                    cell7.innerHTML = '<button type="button" value="button" onclick="uploadFenceData(this)">^</button>';
                }
            }
        };
    });
}

function uploadFenceData(element) {
    var row = element.parentNode.parentNode.rowIndex;
    var table = document.getElementById("userTable");
    var userName = table.rows[row].cells[0].innerHTML;
    var deviceName = table.rows[row].cells[5].innerHTML;
    console.log("Delete user: "+userName);
    try {
        HomeyAPI.api('POST', 'test/uploadFenceData/', {"userName": userName, "deviceName": deviceName}, function(err, result) {
            console.log("Data posted");
            if (!err) {
                HomeyAPI.alert(__('settings.app.messages.fencedate_pushed'));
            } else {
                HomeyAPI.alert(__('settings.app.messages.fencedate_pushed_failed'));
            }
        });
    } catch(err) {
        console.log("uploadFenceData error: "+err);
    }
}

function createUserTable() {
    var table = document.getElementById("userTable");
    document.getElementById("userTable").style.width = "";
    var nRows = table.rows.length;
    if (nRows > 0) {
        for (var i=0; i < nRows; i++) {
            table.deleteRow(-1);
        }
    }
    HomeyAPI.api('GET', 'test/getUserArray/', function(err, result) {
        if (!err) {
            console.log("UserArray data ok");
            for (var i=0; i < result.length; i++) {
                console.log("Create row for " + result[i].name);
                var row = table.insertRow(i);
                if (isEven(table.rows.length)) {
                    row.style.backgroundColor = "rgb(250,250,250)";
                }
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);
                cell1.innerHTML = result[i].name;
                cell2.innerHTML = result[i].token;
                cell3.innerHTML = '<button type="button" value="button" onclick="deleteUserRow(this)">-</button>';
                cell4.innerHTML = '<button type="button" value="button" onclick="generateUserToken(this)">#</button>';
            }
        };
    });
    var row = table.insertRow(-1);
    if (isEven(table.rows.length)) {
        row.style.backgroundColor = "rgb(250,250,250)";
    }
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    cell1.innerHTML = '<input class="form_input" id="addUser" type="text" value="" />';
    cell2.innerHTML = '<button type="button" value="button" onclick="saveUserRow()">+</button>';
}

function deleteUserRow(element) {
    var row = element.parentNode.parentNode.rowIndex;
    var table = document.getElementById("userTable");
    var userName = table.rows[row].cells[0].innerHTML;
    console.log("Delete user: "+userName);
    if (userName !== null && userName !== undefined) {
        HomeyAPI.api('POST', 'test/deleteUser/', {"userName": userName}, function(err, result) {
            console.log("Data posted");
            createUserTable();
        });
    }
}

function saveUserRow() {
    console.log("addRow called");
    var token;
    var userName = document.getElementById('addUser').value;
    console.log("User to add: " + userName);
    if (userName !== null && userName !== undefined && userName !== "") {
        HomeyAPI.api('POST', 'test/addNewUser/', {"userName": userName}, function(err, result) {
            console.log("Data posted");
            createUserTable();
        });
    }
}

function generateUserToken(element) {
    var row = element.parentNode.parentNode.rowIndex;
    var table = document.getElementById("userTable");
    var userName = table.rows[row].cells[0].innerHTML;
    console.log("Update user: "+userName);
    if (userName !== null && userName !== undefined) {
        HomeyAPI.api('POST', 'test/addNewUser/', {"userName": userName}, function(err, result) {
            console.log("Data posted");
            createUserTable();
        });
    }
}

function createFenceTable() {
    var table = document.getElementById("userTable");
    document.getElementById("userTable").style.width = "";
    var nRows = table.rows.length;
    if (nRows > 0) {
        for (var i=0; i < nRows; i++) {
            table.deleteRow(-1);
        }
    }
    var header = table.createTHead();
    var rowhead = header.insertRow(0);
    var cellhead = rowhead.insertCell(0);
    var cellhead1 = rowhead.insertCell(1);
    var cellhead2 = rowhead.insertCell(2);
    var cellhead3 = rowhead.insertCell(3);
    cellhead.innerHTML = "<b>Fence</b>";
    cellhead1.innerHTML="<b>Lon</b>";
    cellhead2.innerHTML="<b>Lat</b>";
    cellhead3.innerHTML="<b>Radius</b>";

    HomeyAPI.api('GET', 'test/getFenceArray/', function(err, result) {
        if (!err) {
            console.log("FenceArray data ok");
            for (var i=0; i < result.length; i++) {
                console.log("Create row for " + result[i].fenceName);
                var row = table.insertRow(i+1);
                if (isEven(table.rows.length)) {
                    row.style.backgroundColor = "rgb(250,250,250)";
                }
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);
                var cell5 = row.insertCell(4);
                cell1.innerHTML = result[i].name;
                cell2.innerHTML = result[i].lon;
                cell3.innerHTML = result[i].lat;
                cell4.style.textAlign="right";
                cell4.innerHTML = result[i].radius;
                cell5.innerHTML = '<button type="button" value="button" onclick="deleteFenceRow(this)">-</button>'
            }
        };
    });
    var row = table.insertRow(-1);
    if (isEven(table.rows.length)) {
        row.style.backgroundColor = "rgb(250,250,250)";
    }
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    cell1.innerHTML = '<input class="form_input" id="addFence" type="text" value="" />';
    cell2.innerHTML = '<button type="button" value="button" onclick="saveFenceRow()">+</button>';
}

function deleteFenceRow(element) {
    var row = element.parentNode.parentNode.rowIndex;
    var table = document.getElementById("userTable");
    var fenceName = table.rows[row].cells[0].innerHTML;
    console.log("Delete fence: "+fenceName);
    if (fenceName !== null && fenceName !== undefined) {
        HomeyAPI.api('POST', 'test/deleteFence/', {"fenceName": fenceName}, function(err, result) {
            console.log("Data posted");
            createFenceTable();
        });
    }

}

function saveFenceRow() {
    console.log("addFenceRow called");
    var fenceName = document.getElementById('addFence').value;
    console.log("Fence to add: " + fenceName);
    if (fenceName !== null && fenceName !== undefined && fenceName !== "") {
        HomeyAPI.api('POST', 'test/addNewFence/', {"fenceName": fenceName}, function(err, result) {
            console.log("Data posted");
            createFenceTable();
        });
    }
}

function useBroker() {
    // console.log( document.getElementById("usebroker").checked )
    if ( document.getElementById("usebroker").checked ) {
        $("#serversettings").show( "fast" )
    } else {
        $("#serversettings").hide( "fast" )
    }
}

function showTab(tab){
    document.getElementById("tabs").style.display = "inline";
    $('.tab').addClass('tab-inactive')
    $('.tab').removeClass('tab-active')

    $('#tabb' + tab).addClass('tab-active')
    $('#tabb' + tab).removeClass('tab-inactive')

    //$('.panel').hide()
    $('#tab' + tab).show()
    if (tab === 1) {createUserStatus()}
    if (tab === 2) {createUserTable()}
    if (tab === 3) {createFenceTable()}
}