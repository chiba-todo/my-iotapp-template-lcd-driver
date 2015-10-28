// Drive the Grive RGB LCD (a JHD1313m1)
// We can do this in either of two ways
//
// The bext way is to use the upm library. which
// contains support for this device
//
// The alternative way is to drive the LCD directly from
// Javascript code using the i2c interface directly
// This approach is useful for learning about using
// the i2c bus. The lcd file is an implementation
// in Javascript for some of the common LCD functions

// configure jshint
/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

// change this to false to use the hand rolled version
var useUpmVersion = true;

// we want mraa to be at least version 0.6.1
var mqtt = require('mqtt');
var mraa = require('mraa');
var version = mraa.getVersion();
if (version >= 'v0.6.1') {
    console.log('mraa version (' + version + ') ok');
}
else {
    console.log('meaa version(' + version + ') is old - this code may not work');
}

if (useUpmVersion) {
    var lcd = require('jsupm_i2clcd');
    var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);
    useUpm();
}else {
    useLcd();
}



//
// MQTT 
//

var org = "80t9vx";                     // <--- update!!
var type = "Edison";                  // <--- update!!
var id = "784b87a8d14f";                // <--- update!!
var auth_token = "T7TtuOcfW*NtCradDK";  // <--- update!!

var authmethod = 'use-token-auth';      // You don't need update this parm

// create clientID and URL to connect IoT foundation
var clientId = 'd:' + org + ':' + type + ':' + id;
var mqtt_url = 'mqtt://' + org + '.messaging.internetofthings.ibmcloud.com:1883';
var credentials = { clientId: clientId, username: authmethod, password: auth_token };

// create a mqtt client
var client  = mqtt.connect(mqtt_url, credentials);

// connect and process
client.on('connect', function () {
    var pub_topic = 'iot-2/evt/status/fmt/json';    // publish a message to a topic
    var pub_message;                                // message to be published
    var sub_topic = 'iot-2/cmd/cid/fmt/json';       // topic to subscribe
    var sub_message;                                // message reached to topic subscribing

    
    
// publish message to IoT foundation
    setInterval(function(){
        pub_message = '{"d":{"Temperature":' + analogVolts() + '}}'; 
        // publish value from light sensor
        var disp_msg = 'Te:'+analogVolts();
        display.setCursor(1,0);
        display.write(disp_msg.substr(0,8));
        
        client.publish(pub_topic, pub_message, function() {
            console.log("Message is published");
        });
    },5000);
    

//subscribe to a topic
  client.subscribe(sub_topic, function() {
  // when a message arrives, do something with it
    client.on('message', function(topic, message, packet) {
      sub_message = message;   //JSON形式
console.log("Received '" + sub_message + "' on '" + topic + "'");
console.log(JSON.parse(sub_message).Message);


      if(JSON.parse(sub_message).Message){
        var disp_msg_sc = JSON.parse(sub_message).Message;    //JSON形式から必要な文字列を取り出して表示
    //            display.clear();
        var i = 0;
    // スクロール：【問題点】スクロールが終わる前に次の文字が来ると重ねてスクロールが始まる
        var lcdScroll = setInterval(function() {
          display.setCursor(0,0);
console.log(''+disp_msg_sc.substr(i) + '                ');
          display.write(''+disp_msg_sc.substr(i) + '                ');
          if (i < disp_msg_sc.length){
            i += 1;
          }else{
            i = 0;
            clearInterval(lcdScroll);
          }
        },400);
      }

// メッセージが「on」なら 13番のオンボードLEDを点灯
    if (JSON.parse(sub_message).LED === "on") {  // when parameter LED is "on", LED is blinked.
                myOnboardLed.write(1);
            } else {
                myOnboardLed.write(0);
            }
    });
  });
});



/**
 * Rotate through a color pallette and display the
 * color of the background as text
 */
function rotateColors(display) {
    var red = 50;
    var green = 50;
    var blue = 50;
    display.setColor(red, green, blue);
    display.clear();
    var cont =0;
    setInterval(function() {
//        console.log(cont);
        if(cont < 255 * 8){
            if(cont % (255 *2) < 255){
                if(red < 255 - 10){red += 10;}                     
            }else{
                if(red > 50 + 10){red -= 10;}
            }
            if(cont % (255 *4) < 255 *2){
                if(green < 255 - 5){green += 5;}                     
            }else{
                if(green > 50 + 5){green -= 5;}
            }
//            console.log(green);
            if(cont % (255 *8) < 255 *4){
                if(blue < 255 - 1){blue += 1;}                     
            }else{
                if(blue > 50 + 1){blue -= 1;}
            }
//            console.log(blue);
            cont += 10;
        }else{
                cont = 0;
                display.clear();
             }
//        blue += 64;
//        if (blue > 255) {
//            blue = 0;
//            green += 64;
//            if (green > 255) {
//                green = 0;
//                red += 64;
//                if (red > 255) {
//                    red = 0;
//                }
//            }
//        }

//        display.clear();
        display.setColor(red, green, blue);
//        display.setCursor(0,0);
//        display.write('red=' + red + ' grn=' + green + '  ');
//        display.setCursor(1,0);
//        display.write('blu=' + blue);  // extra padding clears out previous text
//
        display.setCursor(1,9);
        display.write('c=' + cont);  // extra padding clears out previous text
    }, 500);
}

/**
 * Use the upm library to drive the two line display
 *
 * Note that this does not use the "lcd.js" code at all
 */
function useUpm() {
//    var lcd = require('jsupm_i2clcd');
//    var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);
    display.setCursor(1, 1);
    display.write('hi there');
    display.setCursor(0,0);
    display.write('more text');
    rotateColors(display);
}

    
/**
 * Use the hand rolled lcd.js code to do the
 * same thing as the previous code without the
 * upm library
 */
function useLcd() {
    var lcd = require('./lcd');
    var display = new lcd.LCD(0);

    display.setColor(0, 60, 255);
    display.setCursor(1, 1);
    display.write('hi there');
    display.setCursor(0,0);  
    display.write('more text');
    display.waitForQuiescent()
    .then(function() {
        rotateColors(display);
    })
    .fail(function(err) {
        console.log(err);
        display.clearError();
        rotateColors(display);
    });
}


//A0：温度センサー を読んで、摂氏の値を返す

var B = 3975;
var analogPin0 = new mraa.Aio(0); //setup access analog input Analog pin #0 (A0)

var analogVolts = function () {
    var analogValue = analogPin0.read(); //read the value of the analog pin
    console.log(analogValue); //write the value of the analog pin to the console
    var resistance = (1023 - analogValue) * 10000 / analogValue; //get the resistance of the sensor;
    var celsius_temperature = 1 / (Math.log(resistance / 10000) / B + 1 / 298.15) - 273.15;//convert to temperature via datasheet ;
    var dt =new Date(); 
    console.log(dt + "Celsius Temperature: " + celsius_temperature);
    return celsius_temperature;
};

// Send signal to light LED connected to GPIO(13)
var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output