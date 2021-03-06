import React from 'react';
import {xhttpPost} from './Utilities';

export function TextInput(props){
	const type = (props.type ? ' '+props.type : ' outline');
	const size = (props.size ? ' '+props.size : '');
	const classes = (props.container_classes ? ' '+props.container_classes : '');

	return (
		<span className={'base-input'+type+size+classes} {...props.container_attr}>
			{props.label ? <label htmlFor={props.form_name}>{props.label}</label> : ''}
			<input id={props.form_name} name={props.form_name} {...props.form_attr} />
		</span>		
	)//
}

/*
Example:

<TextInput
	form_name={'test'} // optional
	type={'outline|solid'} // optional
	size={'sm-input|md-input|lg-input'} // optional
	label={'test-input'} // optional
	container_attr={{ }} // optional
	container_classes={'some classes'} // optional
	form_attr={{ type:'text' }} // optional
/>
*/

export function Select(props){
	const type = (props.type ? ' '+props.type : ' outline');
	const size = (props.size ? ' '+props.size : '');
	const classes = (props.container_classes ? ' '+props.container_classes : '');

	return (
		<span className={'base-input'+type+size+classes} {...props.container_attr}>
			{props.label ? <label htmlFor={props.form_name}>{props.label}</label> : ''}
			<select id={props.form_name} name={props.form_name} {...props.form_attr}>

			{props.options.map((option, key) => (
				<option key={key} value={option.value} {...option.attr}>
					{(option.text ? option.text : option.value)}
				</option>
			))}

			</select>
		</span>	
	);
}

/*
Example:

<Select
	options={[
		{value: 'Option 1', text: 'value text(optional)'},
		{value: 'Option 2', text: 'value text(optional)'},
	]}
	form_name={'test-select'} // optional
	type={'outline|solid'} // optional
	size={'sm-input|md-input|lg-input'} // optional
	label={'test-select'} // optional
	container_attr={{ }} // optional
	container_classes={'some classes'} // optional
	form_attr={{ palceholder:'select' }} // optional
/>
*/

export function Textarea(props){
	const size = (props.size ? ' '+props.size : '');
	const type = (props.type ? ' '+props.type : ' outline');
	const classes = (props.container_classes ? ' '+props.container_classes : '');

	return (
		<span className={'base-input '+type+size+classes} {...props.container_attr}>
			{props.label ? <label htmlFor={props.form_name}>{props.label}</label> : ''}
			<textarea id={props.form_name} name={props.form_name} {...props.form_attr}></textarea>
		</span>	
	);
}

/*
Example:

<Textarea
	form_name={'test'} // optional
	type={'outline|solid'} // optional
	size={'sm-input|md-input|lg-input'} // optional
	label={'test-input'} // optional
	container_attr={{ }} // optional
	container_classes={'some classes'} // optional
	form_attr={{ type:'text' }} /> // optional
/>
*/

export function TextInputAddon(props){
	const size = (props.size ? ' '+props.size : '');
	const classes = (props.container_classes ? ' '+props.container_classes : '');
	return (
		<span className={'addon-input '+size+classes} {...props.container_attr}>
			{props.label ? <label htmlFor={props.form_name}>{props.label}</label> : ''}
			<span className="flex-row">
				<span className="addon" aria-hidden="true">{props.addon}</span>
				<input id={props.form_name} name={props.form_name} {...props.form_attr} />
			</span>
		</span>			
	);
}

/*
Example:

<TextInputAddon
	form_name={'test'} // optional
	addon={'addon'} // optional
	size={'sm-input|md-input|lg-input'} // optional
	label={'test-input'} // optional
	container_attr={{ }} // optional
	container_classes={'some classes'} // optional
	form_attr={{ type:'text' }} // optional
/>
*/

export function SelectAddon(props){
	const size = (props.size ? ' '+props.size : '');
	const classes = (props.container_classes ? ' '+props.container_classes : '');
	return (
		<span className={'addon-input '+size+classes} {...props.container_attr}>
			{props.label ? <label htmlFor={props.form_name}>{props.label}</label> : ''}
			<span className="flex-row">
				<span className="addon" aria-hidden="true">{props.addon}</span>
				<select id={props.form_name} name={props.form_name} {...props.form_attr}>
				{props.options.map((option, key) => (
					<option key={key} value={option.value} {...option.attr}>
						{(option.text ? option.text : option.value)}
					</option>
				))}
				</select>				
			</span>			
		</span>	
	);
}

/*
Example:

<SelectAddon
	form_name={'test-select'}
	addon={'addon'}
	options={[
		{value: 'Option 1', text: 'value text(optional)'},
		{value: 'Option 2', text: 'value text(optional)'},
	]}
	size={'sm-input|md-input|lg-input'} // optional
	label={'test-select'} // optional
	container_attr={{ }} // optional
	container_classes={'some classes'} // optional
	form_attr={{ palceholder:'select' }} // optional
/>
*/

export class SearchBox extends React.Component{
    constructor(props){
        super(props);
		this.timeout = null;
		this.search_results_ref = React.createRef();
		this.state = {
			search_results: '',
			focused_form: false,
		};

		this.search = this.search.bind(this);
	}

	search(e){
		clearTimeout(this.timeout);
		this.setState({search_results: ''});
		const form_name = e.target.name;
		const form_value = e.target.value;

		if(form_value !== ''){
			let data = form_name+'='+form_value;

			if(this.props.request_data !== undefined){
				for(let key in this.props.req_form_data){
					data += '&'+key+'='+this.props.req_form_data[key];
				}
			}	
			this.timeout = setTimeout(() => {
				xhttpPost(
					data,
					this.props.request_url,
					this.props.request_headers,
					function(response, status_code, SearchBox){
						SearchBox.setState({
							search_results: SearchBox.props.formatSearchResults(response),
						});
					}, null, this
				);			
			}, 600);
		}
	}

	componentDidUpdate(){
		const focused_form = this.state.focused_form;
		const search_results_ref = this.search_results_ref.current;

		if(focused_form && !search_results_ref.classList.contains('shown')){
			if(this.state.search_results !== ''){
				search_results_ref.classList.add('visible','shown');
			}
		}
		else if(!focused_form&& search_results_ref.classList.contains('shown')){
			search_results_ref.classList.remove('shown');
			search_results_ref.addEventListener('transitionend', () => {
				search_results_ref.classList.remove('visible');
			}, {once: true})
		}
	}


    render(){
        const classes = (
			this.props.container_classes ? ' '+this.props.container_classes : ''
		);
		const size = (this.props.size ? ' '+this.props.size : '');
		const type = (this.props.type ? ' '+this.props.type : ' outline');

		if(this.props.addon !== undefined){
			return (
				<span className={'addon-input search-box'+size+classes}
				{...this.props.container_attr}>
					{
						this.props.label ?
						<label htmlFor={this.props.form_name}>{this.props.label}</label> : ''
					}
					<span className="flex-row">
						<span className="addon" aria-hidden="true">
							{this.props.addon}
						</span>
						<input id={this.props.form_name} name={this.props.form_name}
						{...this.props.form_attr} onChange={(e) => {this.search(e)}}
						onFocus={() => {this.setState({focused_form: true})}}
						onBlur={() => {this.setState({focused_form: false})}}
						{...this.props.form_attr}/>
					</span>
					<div className={'search-results-container'}
					ref={this.search_results_ref}>
						{this.state.search_results}
					</div>
				</span>					
			);
		}
		else{
			return (
				<span className={'base-input search-box'+type+size+classes}
				{...this.props.container_attr}>
					{
						this.props.label ?
						<label htmlFor={this.props.form_name}>{this.props.label}</label> : ''
					}
					<input id={this.props.form_name} name={this.props.form_name}
					{...this.props.form_attr} onChange={(e) => {this.search(e)}}
					onFocus={() => {this.setState({focused_form: true})}}
					onBlur={() => {this.setState({focused_form: false})}}/>
					<div className={'search-results-container'}
					ref={this.search_results_ref}>
						{this.state.search_results}
					</div>
				</span>	
			);
		}
    }
}

/*
EXAMPLE:
<SearchBox
	form_name={'test'}
	request_url={'url}
	formatSearchResults={this.somefunction}
	addon={'addon'} // use this property to use addon input
	request_data={{}} // optional, additional data to be sent alongside the search box input data
	request_headers={{}} // optional, the request headers
	type={'outline|solid'} // optional
	size={'sm-input|md-input|lg-input'} // optional
	label={'test-input'} // optional
	container_attr={{ }} // optional
	container_classes={'some classes'} // optional
	form_attr={{ type:'text' }} // optional
/>
*/

export function Checkbox(props){
	const type = ' '+props.type;
	const classes = (props.container_classes ? ' '+props.container_classes : '');
	return (
		<label className={'multi-choice checkbox'+type+classes} {...props.container_attr}>
			{props.label ? <span className="choice-name">{props.label}</span> : ''}
			<input type="checkbox" name={props.form_name} value={props.value} {...props.form_attr}/>
			<span className="checkmark">
				<span></span>
			</span>
		</label>
	);
}

/*
Example:

<Checkbox type={'basic|outline'} form_name={'test-cb'} label={'Test'} value={'test'}
	container_attr={{ }} // optional
	container_classes={'some classes'} // optional
	form_attr={{  }} // optional
/>
*/

export function Radio(props){
	const type = ' '+props.type;
	const classes = (props.container_classes ? ' '+props.container_classes : '');
	return (
		<label className={'multi-choice radio'+type+classes} {...props.container_attr}>
			{props.label ? <span className="choice-name">{props.label}</span> : ''}
			<input type="radio" name={props.form_name} value={props.value} {...props.form_attr}/>
			<span className="checkmark">
				<span></span>
			</span>
		</label>
	)//
}

/*
Example:

<Radio form_name={'test-cb'} type={'basic|outline'} label={'Test'} value={'test'}
	container_attr={{ }} // optional
	container_classes={'some classes'} // optional
	form_attr={{  }} // optional
/>
*/