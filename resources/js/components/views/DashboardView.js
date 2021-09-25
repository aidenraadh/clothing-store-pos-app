import React from 'react';

import {Buttons} from './../Buttons.js';
import {TextInput} from './../Forms.js';
import {SectionHeader,Grid} from './../Layouts.js';
import {SimpleCard, StatsCard} from './../Cards.js';
import {Modal} from './../Windows.js';
import {SVGIcons} from './../UtilityComponents.js';
import {xhttpPost,numToPrice, prettyTime,serializeObj, parseIfInt} from './../Utilities.js';

export default class DashboardView extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			filter_statistics_modal: false,

			/* All statistics filters values */
			statistics_start_time: this.props.root.default_date,
			statistics_end_time: this.props.root.default_date,
		};

		this.generateTotalIncome = this.generateTotalIncome.bind(this);
		this.generateTotalItemsSold = this.generateTotalItemsSold.bind(this);
		this.generateProductionPrices = this.generateProductionPrices.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.filterStatistics = this.filterStatistics.bind(this);
		this.toggleModal = this.toggleModal.bind(this);
		this.refreshPage = this.refreshPage.bind(this);
	}

	generateTotalIncome(){
		const root = this.props.root;
		const statistics = root.state.statistics;
		let total_income_counted = 0;
		let StatsGrid_JSX = null;

		if(statistics === undefined){
			StatsGrid_JSX = root.viewStatusMsg('Loading...');
		}
		else if(statistics.transactions.length === 0){
			StatsGrid_JSX = root.viewStatusMsg('Toko belum ada.');
		}
		else{
			StatsGrid_JSX = (<>			
			<Grid
				columns={'3'}
				items={(() => {
					const transactions = statistics.transactions;
					let StatsCards_JSX = [];

					for(let store_name in transactions){
						total_income_counted += (transactions[store_name].total_income ? 
							transactions[store_name].total_income : 0
						);
						StatsCards_JSX.push(
							<StatsCard
								type={'primary'} color={'blue'} icon={'sale_1'}
								main_label={'Total Pendapatan'}
								secondary_label={'Dari '+store_name}
								number_label={'Rp. '+
									(
										transactions[store_name].total_income ?
										numToPrice(transactions[store_name].total_income): 
										0
									)
								}
							/>
						);
					}
					return StatsCards_JSX;
				})()}
			/>	
			</>);
		}
		return (
		<SimpleCard
			heading={'Pendapatan'} cardTag={'article'}
			headingTag={'h2'}
			body={<>
				<p className="text-center text-dark-65"
				style={{borderBottom: '0.1rem solid #D9D9D9', paddingBottom: '0.8em',
				marginBottom: '0.8em',fontSize: '1.5rem'}}>
					{'Tanggal: '+(
						statistics === undefined ?
						'--------' :
						prettyTime(
							statistics.filters.statistics_start_time,
							(statistics.filters.timezone_offset === 0 ? true : false)
						)+' - '+
						prettyTime(
							statistics.filters.statistics_end_time,
							(statistics.filters.timezone_offset === 0 ? true : false)
						)
					)}
				</p>
            	<p className="text-medium text-center text-dark-65"
            	style={{borderBottom: '0.1rem solid #D9D9D9', paddingBottom: '0.8em',
            	marginBottom: '0.8em'}}>
            	    {
						'Total: Rp. '+
						numToPrice(total_income_counted)
					}
            	</p>
				{StatsGrid_JSX}
			</>}
			container_classes={'dashboard-card'}
		/>	
		);	
	}

	generateTotalItemsSold(){
		const root = this.props.root;
		const statistics = root.state.statistics;
		let total_items_sold_counted = 0;
		let StatsGrid_JSX = null;

		if(statistics === undefined){
			StatsGrid_JSX = root.viewStatusMsg('Loading...');
		}
		else if(statistics.transactions.length === 0){
			StatsGrid_JSX = root.viewStatusMsg('Toko atau gudang belum ada.');
		}
		else{
			StatsGrid_JSX = (<>			
			<Grid
				columns={'3'}
				items={(() => {
					const transactions = statistics.transactions;
					let StatsCards_JSX = [];

					for(let store_name in transactions){
						total_items_sold_counted += (transactions[store_name].total_items_sold ?
							transactions[store_name].total_items_sold : 0
						);
						StatsCards_JSX.push(
							<StatsCard
								type={'primary'} color={'purple'} icon={'hanger'}
								main_label={'Total Item Terjual'}
								secondary_label={'Dari '+store_name}
								number_label={(
									transactions[store_name].total_income ?
									'Rp. '+numToPrice(
										transactions[store_name].total_items_sold
									) : 0
								)}
							/>
						);
					}
					return StatsCards_JSX;
				})()}
			/>	
			</>);
		}
		return (
		<SimpleCard
			heading={'Item Terjual'} cardTag={'article'}
			headingTag={'h2'}
			body={<>
				<p className="text-center text-dark-65"
				style={{borderBottom: '0.1rem solid #D9D9D9', paddingBottom: '0.8em',
				marginBottom: '0.8em',fontSize: '1.5rem'}}>
					{'Tanggal: '+(
						statistics === undefined ?
						'--------' :
						prettyTime(
							statistics.filters.statistics_start_time,
							(statistics.filters.timezone_offset === 0 ? true : false)

						)+' - '+
						prettyTime(
							statistics.filters.statistics_end_time,
							(statistics.filters.timezone_offset === 0 ? true : false)
						)	
					)}
				</p>			
            	<p className="text-medium text-center text-dark-65"
            	style={{borderBottom: '0.1rem solid #D9D9D9', paddingBottom: '0.8em',
            	marginBottom: '0.8em'}}>
            	    {'Total: '+total_items_sold_counted}
            	</p>
				{StatsGrid_JSX}
			</>}
			container_classes={'dashboard-card'}
		/>	
		);	
	}	

	generateProductionPrices(){
		const root = this.props.root;
		const statistics = root.state.statistics;
		let production_prices_counted = 0;
		let CardBody_JSX = null;

		if(statistics === undefined){
			CardBody_JSX = root.viewStatusMsg('Loading...');
		}
		else if(statistics.total_production_prices.length === 0){
			CardBody_JSX = root.viewStatusMsg('Toko atau gudang belum ada.');
		}
		else{
			CardBody_JSX = (<>			
			<Grid
				columns={'3'}
				items={(() => {
					const total_production_prices = statistics.total_production_prices;
					let Cards_JSX = [];

					for(let store_name in total_production_prices){
						production_prices_counted += (total_production_prices[store_name] ?
							total_production_prices[store_name] : 0
						);
						Cards_JSX.push(
							<StatsCard
								type={'primary'} color={'green'} icon={'price_2'}
								main_label={'Total harga produksi'}
								secondary_label={'Dari '+store_name}
								number_label={
									'Rp. '+numToPrice(total_production_prices[store_name])
								}
							/>
						);
					}
					return Cards_JSX;
				})()}
			/>	
			</>);
		}		
		return (
		<SimpleCard
			heading={'Harga Produksi'} cardTag={'article'}
			headingTag={'h2'}
			body={<>
            	<p className="text-medium text-center text-dark-65"
            	style={{borderBottom: '0.1rem solid #D9D9D9', paddingBottom: '0.8em',
            	marginBottom: '0.8em'}}>
            	    {
						'Total: Rp. '+
						numToPrice(production_prices_counted)
					}
            	</p>
				{CardBody_JSX}			
			</>}
			container_classes={'dashboard-card'}
		/>	
		);		
	}

	handleChange(e, is_int = false){
		const form = e.target;
		const form_name = form.name;
		const value = (
			is_int ? (form.value ? parseInt(form.value) : form.value) :
			form.value
		);
		this.setState({[form_name]: value});
	}	

	filterStatistics(){
		const root = this.props.root;
		
		const data = serializeObj({
			statistics_start_time: this.state.statistics_start_time+
				' 00:00:00',
			statistics_end_time: this.state.statistics_end_time+
				' 23:59:59',
			timezone_offset: root.timezone_offset,
		});

		root.setState({dark_lds: true});
        xhttpPost(data, root.props.urls.dashboard,
            {'X-CSRF-TOKEN': root.props.csrf_token},
            function(response, status_code, DashboardView){
				const parsed = JSON.parse(response);

                root.setState({
					statistics: JSON.parse(response),
					dark_lds: false,
				});
				DashboardView.setState({
					filter_statistics_modal: false,
				});
            },
            function(response, status_code){
                root.xhrFailCallback(response, status_code);
                root.setState({dark_lds: false});
            }, this
        );  		
	}	

    toggleModal(modal){
        this.setState((state) => ({
            [modal]: !state[modal]
        }));
    }	

    refreshPage(force = false){
        const root = this.props.root;

        if(root.state.statistics === undefined || force){
            root.refreshStatistics(force);
        }
    }

    componentDidMount(){
        this.props.root.scrollToTop();		
		this.refreshPage();
    }

	render(){
		const root = this.props.root;

		return (<>
			<SectionHeader
				heading_tag={'h1'} header_tag={'header'}
				container_classes={'page-header'}
				heading={
				<span className="flex-row items-center">
					<SVGIcons
						name={'layers'} color={'blue'}
						attr={{style: {width: '1.6em'}}}
					/>						
					Dashboard
				</span>						
				}
                header_actions={
                    <Buttons tag={'button'} text={'Refresh'}
                        settings={{size: 'sm',type: 'primary',color: 'blue'}}
                        icon={{name: 'update', iconOnly: true}}
                        attr={{type: 'button', onClick: () => {this.refreshPage(true)}}}
                    />                      
                }				
			/>
            <div className="flex-row content-end">			
                <Buttons
					tag={'button'} text={'Filter'} icon={{name: 'sort_1'}}
                    settings={{size: 'sm',type: 'primary',color: 'blue'}}
                    attr={{type: 'button',
						style: {flexShrink: 0, width: '10rem',marginBottom: '2rem'},
                        onClick: () => {this.toggleModal('filter_statistics_modal')},
                    }}
                />                
            </div>			
			{this.generateTotalIncome()}
			{this.generateTotalItemsSold()}
			{this.generateProductionPrices()}
			<Modal
				heading={'Filter Dashboard'} classes={'content-sized-modal'}
				toggleModal={() => {this.toggleModal('filter_statistics_modal')}}
				modalShown={this.state.filter_statistics_modal}
				attr={{id: 'filter-dashboard-modal'}}
				body={<>
					<TextInput
						type={'outline'} size={'md-input'} label={'Dari'}
						form_name={'statistics_start_time'}
						container_attr={{style: {width: '100%',marginBottom: '2rem'}}}
						form_attr={{ type:'date',style: {width: '100%'},
							value: this.state.statistics_start_time,
							onChange: (e) => {this.handleChange(e)},
						}}
					/>
					<TextInput
						type={'outline'} size={'md-input'} label={'Hingga'}
						form_name={'statistics_end_time'}
						container_attr={{style: {width: '100%'}}}
						form_attr={{type:'date',style: {width: '100%'},
							value: this.state.statistics_end_time,
							onChange: (e) => {this.handleChange(e)},
						}}
					/>		
				</>}
				footer={
					<Buttons tag={'button'} text={'Filter'}
						settings={{size: 'md',type: 'primary',color: 'blue'}}
						attr={{type: 'button', style: {flexShrink: 0, width: '10rem'},
							onClick: this.filterStatistics,
						}}
					/>   		
				}
				footer_align={'center'}
			/>			
		</>);
	}
}	