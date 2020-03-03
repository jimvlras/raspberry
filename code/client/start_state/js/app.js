var selected_device = null;
var connected = false;
var connected_server;

// cached characteristics
var mesh_proxy_data_in;
var mesh_proxy_data_out;
var app = {};

app.MESH_PROXY_SERVICE = '00001828-0000-1000-8000-00805f9b34fb';
app.MESH_PROXY_DATA_IN = '00002add-0000-1000-8000-00805f9b34fb';
app.MESH_PROXY_DATA_OUT = '00002ade-0000-1000-8000-00805f9b34fb';

var has_mesh_proxy_service = false;
var has_mesh_proxy_data_out = false;
var has_mesh_proxy_data_in = false;
var valid_pdu = false;

var iv_index = "12345677";
var netkey = "7dd7364cd842ad18c17c2b820c84c3d6";
var appkey = "63964771734fbd76e3b40519d1d94a48";
var encryption_key = "";
var privacy_key = "";
var network_id = "";

var sar = 0;
var msg_type = 0;
// network PDU fields
var ivi = 0;
var nid = "00";
var ctl = 0;
var ttl = "03";
var seq = 460810; // 0x0x07080a 
var src = "1234";
var dst = "C105";
var seg = 0;
var akf = 1;
var aid = "00";
var opcode;
var opparams;
var access_payload;
var transmic;
var netmic;

var mtu = 33;

var proxy_pdu;

var msg;

app.initialize = function () {
    N = utils.normaliseHex(netkey);
    P = "00";
    A = utils.normaliseHex(appkey);

    msg = document.getElementById('message');
    document.getElementById("nid").innerHTML = "0x" + nid;
    document.getElementById("aid").innerHTML = "0x" + aid;
    document.getElementById("encryption_key").innerHTML = "0x" + encryption_key;
    document.getElementById("privacy_key").innerHTML = "0x" + privacy_key;
    document.getElementById("network_id").innerHTML = "0x" + network_id;
    document.getElementById("seq").innerHTML = "";
    document.getElementById("ivi").innerHTML = "0x" + ivi.toString();
    document.getElementById("access_payload_section").hidden = false;
    selected_device = null;
    app.setBluetoothButtons();
    app.restoreSEQ();    
    app.deriveProxyPdu();
};

app.restoreSEQ = function () {
    seq = 0;
    if (typeof (Storage) !== "undefined") {
        var restored_seq = localStorage.getItem('SEQ');
        if (restored_seq != null) {
            seq = parseInt(restored_seq);
        }
        document.getElementById('seq').innerHTML = utils.toHex(seq, 3);
    } else {
        alert("Can't restore SEQ value. Replay detection will probably interfere with use!");
    }
}

app.findProxies = function () {
    alert("this function has not yet been implemented");
}

app.connection = function () {
    alert("this function has not yet been implemented");
}

app.deriveProxyPdu = function () {
    console.log("deriveProxyPdu");
    valid_pdu = true;
}

app.submitPdu = function () {
    alert("this function has not yet been implemented");
}

app.displayConnectionStatus = function () {
    if (connected) {
        document.getElementById('bluetooth_status').innerHTML = "CONNECTED";
        devname = "";
        if (selected_device.name != undefined) {
            devname = selected_device.name + " --> ";
        }
        document.getElementById('selected_device').innerHTML = devname + selected_device.id;
    } else {
        document.getElementById('bluetooth_status').innerHTML = "DISCONNECTED";
    }
}

app.setBluetoothButtons = function () {
    console.log("setBluetoothButtons: connected=" + connected + ",selected_device=" + selected_device);
    btn_connection = document.getElementById('btn_connection');
    if (connected == false && selected_device == null) {
        btn_connection.innerHTML = "Connect";
        app.enableButton('btn_scan');
        app.disableButton('btn_connection');
        app.disableButton('btn_submit');
        return;
    }
    if (connected == false && selected_device != null) {
        btn_connection.innerHTML = "Connect";
        app.enableButton('btn_scan');
        app.enableButton('btn_connection');
        app.disableButton('btn_submit');
        return;
    }
    btn_connection.innerHTML = "Disconnect";
    app.disableButton('btn_scan');
    app.enableButton('btn_connection');
    if (has_mesh_proxy_service && has_mesh_proxy_data_in) {
        app.enableButton('btn_submit');
    }
};

app.clearMessage = function () {
    console.log("clearMessage");
    msg.style.color = "#ffffff";
    msg.innerHTML = "&nbsp;";
    msg.hidden = false;
};

app.showMessage = function (msg_text) {
    msg.style.color = "#ffffff";
    msg.innerHTML = msg_text;
    document.getElementById('message').hidden = false;
};

app.showMessageRed = function (msg_text) {
    msg.style.color = "#ff0000";
    msg.innerHTML = msg_text;
    document.getElementById('message').hidden = false;
};

app.disableButton = function (btn_id) {
    console.log("disableButton: " + btn_id);
    var btn = document.getElementById(btn_id);
    btn.style.color = "gray";
}

app.enableButton = function (btn_id) {
    console.log("enableButton: " + btn_id);
    var btn = document.getElementById(btn_id);
    btn.style.color = "white";
}

app.buttonIsDisabled = function (btn_id) {
    var btn = document.getElementById(btn_id);
    return (btn.style.color === "gray");
}

app.wrongServices = function () {
    app.showMessageRed("Error: peripheral device is not running the required Bluetooth services");
    selected_device.gatt.disconnect();
}

app.onOpcodeSelect = function (selected) {
    onoff_set_params_visible = false;
    access_payload_visible = false;
    if (selected.value == "0000") {
        access_payload_visible = true;
    }
    if (selected.value == "8202") {
        onoff_set_params_visible = true;
    }
    if (selected.value == "8203") {
        onoff_set_params_visible = true;
    }
    document.getElementById("access_payload_section").hidden = !access_payload_visible;
    document.getElementById("generic_onoff_params_onoff").hidden = !onoff_set_params_visible;
    document.getElementById("generic_onoff_params_tid").hidden = !onoff_set_params_visible;
    document.getElementById("generic_onoff_params_trans_time").hidden = !onoff_set_params_visible;
    document.getElementById("generic_onoff_params_delay").hidden = !onoff_set_params_visible;
};

app.onNetKeyChanged = function () {
    netkey = document.getElementById("netkey").value;
    k2_material = crypto.k2(netkey, "00");
    hex_encryption_key = k2_material.encryption_key;
    hex_privacy_key = k2_material.privacy_key;
    hex_nid = k2_material.NID;
    network_id = crypto.k3(netkey);
    document.getElementById("nid").innerHTML = "0x" + hex_nid;
    document.getElementById("encryption_key").innerHTML = "0x" + encryption_key;
    document.getElementById("privacy_key").innerHTML = "0x" + privacy_key;
    app.deriveProxyPdu();
};

app.onAppKeyChanged = function () {
    appkey = document.getElementById("appkey").value;
    A = utils.normaliseHex(appkey);
    aid = crypto.k4(appkey);
    document.getElementById("aid").innerHTML = "0x" + aid;
    app.deriveProxyPdu();
};

app.onIvIndexChanged = function () {
    iv_index = document.getElementById("iv_index").value;
    I = utils.normaliseHex(iv_index);
    ivi = utils.leastSignificantBit(parseInt(I, 16));
    document.getElementById("ivi").innerHTML = "0x" + ivi;
    app.deriveProxyPdu();
};

app.onTtlChanged = function () {
    ttl = document.getElementById("ttl").value;
    app.deriveProxyPdu();
};

app.onSrcChanged = function () {
    src = document.getElementById("src").value;
    app.deriveProxyPdu();
};

app.onDstChanged = function () {
    dst = document.getElementById("dst").value
    app.deriveProxyPdu();
};

app.onSarSelect = function (selected) {
    var selected_sar = document.getElementById("sar_selection");
    sar = parseInt(selected_sar.options[selected_sar.selectedIndex].value);
    app.deriveProxyPdu();
};

app.onMsgTypeSelect = function (selected) {
    app.deriveProxyPdu();
};

app.onOnOffSelect = function (selected) {
    app.deriveProxyPdu();
};

app.onAccessPayloadChanged = function () {
    access_payload = document.getElementById("access_payload_hex").value
    app.deriveProxyPdu();
};

app.onTidChange = function (selected) {
    app.deriveProxyPdu();
};

app.onTransTimeChange = function (selected) {
    app.deriveProxyPdu();
};

app.onDelayChange = function (selected) {
    app.deriveProxyPdu();
};

app.onMtuChanged = function () {
    mtu = parseInt(document.getElementById("mtu").value);
    app.deriveProxyPdu();
};