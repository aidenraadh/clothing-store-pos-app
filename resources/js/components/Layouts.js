import React from 'react';

export function Grid(props){
	const GridTag = (props.grid_tag ? props.grid_tag : 'div');
	const classes = props.container_classes ? ' '+props.container_classes : '';
	
	return (
		<GridTag className={'grid-'+props.columns+classes} {...props.container_attr}>
			{props.items.map((item, key) => (

			<div key={key} className="grid-item">
			{item}
			</div>
			
			))}		
		</GridTag>
	) //;
}

/*
Example:

<Grid
	columns={'3'} // max columns = 3
	items={[
		'Items', 'Items',
	]}
	grid_tag={} // optional
	container_attr={{}} // optional
/>	
*/

export function SectionHeader(props){
	const container_classes = (props.container_classes ? ' '+props.container_classes : '');
	const HeaderTag = (props.header_tag ? props.header_tag : 'div');
	const HeadingTag = (props.heading_tag ? props.heading_tag : 'h6');

	return (
		<HeaderTag className={'section-header flex-row content-space-between items-center'+container_classes}
		{...props.container_attr}>
			<HeadingTag className="heading flex-row items-center text-semi-bold text-dark-2">{props.heading}</HeadingTag>

			{props.header_actions ? 
			<section className="header-actions flex-row items-center">
				{props.header_actions}
			</section> : ''
			}
		</HeaderTag>
	);
}

/*
Example:
<SectionHeader
	heading={'Hotel '+user_type}
	header_actions={'Some actions here...'} // optional
	header_tag={'header'} // optional
	heading_tag={'h2'} // optional
	container_classes={'some classes here'} // optional
	container_attr={{}} // optional
/>
*/