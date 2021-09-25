import React from 'react';

import IndexStorageItemsView from './IndexStorageItemsView.js';
import AddStorageItemsView from './AddStorageItemsView.js';

export default class ItemsStorageView extends React.Component{
	constructor(props){
		super(props);
		this.state = {
            current_view: 0,
		};
        this.generateView = this.generateView.bind(this);
        this.changeView = this.changeView.bind(this);
	}

    changeView(id){
        this.setState(({current_view: id}));
    }
    generateView(){
        switch(this.state.current_view){
            case 0: return (
                <IndexStorageItemsView
                    root={this.props.root}
                    parent={this}
                    items={this.props.items}
                />
            ); break;
            case 1: return (
                <AddStorageItemsView
                    root={this.props.root}
                    parent={this}
                />
            ); break;
            default: return 'View not found';
        }
    }

	render(){
		return this.generateView();
	}
}	