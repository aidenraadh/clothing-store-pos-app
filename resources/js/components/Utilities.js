import React from 'react';

export function xhttpPost(data, url, headers, successCallback = null, failCallback = null, callingComponent = null){
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function(){
	  	if( (this.readyState == 4 && this.status == 200) && successCallback ){
			successCallback(this.responseText, this.status, callingComponent);
		}
		else if((this.readyState == 4 && this.status >= 300) && failCallback){
			failCallback(this.responseText, this.status, callingComponent);
		}
	};

	xhttp.open('POST', url, true);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.setRequestHeader("Accept", "application/json");
	for(let name in headers){
		xhttp.setRequestHeader(name, headers[name]);
	}
	xhttp.send(data);		
}

export function xhttpGet(form_node, URL, callback, callingComponent){
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
	  	if( (this.readyState == 4 && this.status == 200) && callback ){
	  		callback(this.responseText, callingComponent);
	  	}
	};

	const form = new FormData(form_node);
	xhttp.open('GET', URL, true);
	xhttp.send(form);	
}

export function parseIfJson(data){
	let parsed = null;
    try {
        parsed = JSON.parse(data);
    } catch (e) {
        return data;
    }

    if(typeof parsed === 'object'){
    	return parsed;
    }

    return data;
}
// Parse a value to integer and return the integer
// If cant be parsed, return the original value
export function parseIfInt(value){
	const int = Number(value);
	if(value === '' || isNaN(int)) return value;
	return int;
}
/*
This function format database rows into Javascript Map object.
The map key is the row's id, and this function takes the database
rows and the the column name whose value will be used as Map key.
 */
export function formatData(data, map_key){
	let formatted_data = new Map();

	data.forEach((item) => {
		let item_properties = {};
		let item_keys = Object.keys(item);

		item_keys.forEach((item_key) => {
			if(item_key !== map_key){
				item_properties[item_key] = parseIfJson(item[item_key]);
			}
		});

		formatted_data.set(parseInt(item[map_key]), item_properties);
	});

	return formatted_data;
}

export function formatTime(time, utc = false, with_time = false){
	let date = null;
	if(typeof time === 'object'){
		date = time;
	}
	else{
		time = time.replace(' ', 'T');
		if(utc) time += 'Z';
	
		date = new Date(time);
	}

	const formatted_time = (with_time ? ' '+
		(date.getHours() < 10 ? '0'+date.getHours() : date.getHours())+':'+
		(date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes())+':'+
		(date.getSeconds() < 10 ? '0'+date.getSeconds() : date.getSeconds()) :
		''
	);
	
	return (
		date.getFullYear()+'-'+
		(date.getMonth() + 1 < 10 ? '0'+(date.getMonth()+1) : (date.getMonth()+1))+'-'+
		(date.getDate() < 10 ? '0'+date.getDate() : date.getDate())+
		formatted_time
	);
}

export function prettyTime(time, utc = false, with_time = false){
	time = time.replace(' ', 'T');
	if(utc) time += 'Z';	

	const date = new Date(time);
	
	const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
	const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
		"Jul", "Agu", "Sep", "Okt", "Nov", "Des"
	];

	const formatted_time = (with_time ? ' '+
		(date.getHours() < 10 ? '0'+date.getHours() : date.getHours())+':'+
		(date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes())
		: ''
	);
	
	return (
		days[ date.getDay() ]+', '+
		(date.getDate() < 10 ? '0'+date.getDate() : date.getDate())+' '+
		months[ date.getMonth() ]+' '+
		date.getFullYear().toString().substr(2)+' '+
		formatted_time
	);
}

export function numToPrice(num){
	// Convert num to string then to array
	let price = num.toString().split('');
	const price_length = price.length;

	if(price_length > 3){
		// Get the initial dot position
		let dot_pos = (price_length % 3 ? price_length % 3 : 3);
		// Add the dot to the initial position
		price.splice( dot_pos, 0, '.' );
		// Add the dot again to the next 3 zeros
		for (dot_pos += 4; dot_pos <= price_length; dot_pos += 4) {
			price.splice( dot_pos, 0, '.' );
		}
	}
	// Convert array to string.
	return price.join('');
}

export function serializeObj(obj){
	let key_values = [];
	for(let key in obj){
		key_values.push(key+'='+obj[key]);
	}
	return key_values.join('&');
}

export function initDropzone(id, url, headers, param_name = 'file', max_file = null){
	// Remove previously created dropozone hidden input
	let dz_hidden_inputs = document.querySelectorAll('input.dz-hidden-input');
	dz_hidden_inputs.forEach((input) => {
		input.remove();
	});

	return new Dropzone('#'+id, {
		url: url,
		headers: headers,
		paramName: param_name,
		maxFiles: max_file,
		addRemoveLinks: true,
		dictRemoveFile: '&times; Remove file',
		accept: function(file, done){
			const uploaded_files = this.files;
			const uploaded_filenames = uploaded_files.map((uploaded_file, index) => {
				if(index < uploaded_files.length - 1){
					return uploaded_file.name;
				}
			});
			if( uploaded_filenames.includes(file.name) ){
				done(['Cant upload file with a same name']);
			}
			else { done(); }
		},
		error: function(file, errors){
			alert(errors);
			this.removeFile(file);
		},
	});	
}

// Remove all files and thumnails in the dropzone
export function resetDropzone(dropzone){
	const previewEl = dropzone.element.childNodes;
	dropzone.removeAllFiles();

	previewEl.forEach((el) => {
		if(el.classList.contains('dz-preview')){
			el.remove();
		}
	});	
}

export function intPhone(phone){
	if(phone && phone.charAt(0) === '0'){
		return phone.replace("0", "62");
	}

	return phone;
}