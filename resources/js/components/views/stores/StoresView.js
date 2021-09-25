import React from 'react';

import IndexStoresItemsView from './IndexStoresItemsView.js';
import AddStoreItemsView from './AddStoreItemsView.js';

export default class StoresView extends React.Component{
	constructor(props){
		super(props);
		this.state = {
            current_view: 0,
            sibling_data: null           
		};

        this.generateView = this.generateView.bind(this);
        this.changeView = this.changeView.bind(this);
	}

    changeView(id, sibling_data = null){
        this.setState({current_view: id, sibling_data: sibling_data});
    }
    
    formatItemsForStoring(items){
        let frmtd_items = {};
        items.forEach((item) => {
            frmtd_items[item.id] = {};
            for(let size in item.details){
                frmtd_items[item.id][size] = {
                    // Make sure the quantity is not string
                    quantity: (
                        typeof item.details[size].quantity == 'string' ?
                        0 : item.details[size].quantity
                    )
                };                  
            }
        });
        return frmtd_items;
    }

    generateView(){
        switch(this.state.current_view){
            case 0: return (
                <IndexStoresItemsView
                    root={this.props.root}
                    parent={this}
                    sibling_data={this.state.sibling_data}
                    store={this.props.store}
                />
            ); break;
            case 1: return (
                <AddStoreItemsView
                    root={this.props.root}
                    parent={this}
                    sibling_data={this.state.sibling_data}
                    store={this.props.store}
                />
            ); break;
            default: return 'View not found';
        }
    }

	render(){
		return this.generateView();
	}
}	