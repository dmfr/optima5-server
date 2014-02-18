Ext.define('MrFoxyMenuItemModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'type_header',  type: 'boolean'},
		{name: 'type_separator',   type: 'boolean'},
		{name: 'type_action',   type: 'boolean'},
		{name: 'separator_label',   type: 'string'},
		{name: 'action_iconCls',   type: 'string'},
		{name: 'action_qtip',   type: 'string'},
		{name: 'action_caption',   type: 'string'},
		{name: 'action_sendEvent', type:'string'}
	]
});

Ext.define('Optima5.Modules.Spec.WbMrfoxy.MainMenu',{
	extend:'Ext.view.View',
	requires:[
	],
	
	initComponent: function() {
		 var viewItemTpl = new Ext.XTemplate(
			'<tpl for=".">',
			'<div class="op5-spec-mrfoxy-mainmenu-item">',
				'<tpl if="type_header">',
					'<div class="op5-spec-mrfoxy-mainmenu-header"></div>',
				'</tpl>',
				
				'<tpl if="type_separator">',
					'<div class="x-clear"></div>',
					'<div class="op5-spec-mrfoxy-mainmenu-separator">{separator_label}</div>',
				"</tpl>",
			
				'<tpl if="type_action">',
					'<div class="op5-spec-mrfoxy-mainmenu-action">',
						'<div class="op5-spec-mrfoxy-mainmenu-action-icon {action_iconCls}" data-qtip="{action_qtip:htmlEncode}"></div>',
						'<span>{action_caption:htmlEncode}</span>',
					'</div>',
				'</tpl>',
			'</div>',
			'</tpl>'
		);
		 
		var itemsStore = Ext.create('Ext.data.Store',{
			model:'MrFoxyMenuItemModel',
			data:[
				{type_header:true},
				{type_separator:true, separator_label: 'Manage Promotions'},
				{type_action:true, action_caption: 'Encode new Promotion', action_sendEvent:'promo_new', action_iconCls:'op5-spec-mrfoxy-icon-promotion'},
				{type_action:true, action_caption: 'Headlines', action_sendEvent:'promo_headlines', action_iconCls:'op5-spec-mrfoxy-icon-headlines'},
				{type_action:true, action_caption: 'Promotions Database', action_sendEvent:'promo_list', action_iconCls:'op5-spec-mrfoxy-icon-promostore'},
				{type_action:true, action_caption: 'Calendar', action_sendEvent:'promo_calendar', action_iconCls:'op5-spec-mrfoxy-icon-calendar'},
				{type_separator:true, separator_label: 'Analysis / Queries'},
				{type_action:true, action_caption: 'Performance Analysis', action_sendEvent:'stat_performance', action_iconCls:'op5-spec-mrfoxy-icon-statperf'},
				{type_action:true, action_caption: 'Financial Dashboard', action_sendEvent:'stat_finance', action_iconCls:'op5-spec-mrfoxy-icon-statfinance'},
				{type_action:true, action_caption: 'Query engine', action_sendEvent:'stat_query', action_iconCls:'op5-spec-mrfoxy-icon-statquery'},
			]
		}) ;
		 
		Ext.apply(this,{
			cls: 'op5-spec-mrfoxy-mainmenu',
			tpl: viewItemTpl,
			itemSelector: 'div.op5-spec-mrfoxy-mainmenu-item',
			overItemCls: 'op5-spec-mrfoxy-mainmenu-item-over',
			store: itemsStore,
			stateId: "mainmenu",
			stateful: true,
		}) ;
		
		this.addEvents('actionclick') ;
		
		this.on('viewready',this.arrangeItems,this,{single:true}) ;
		this.on('resize',this.arrangeItems,this) ;
		this.on('itemclick',this.itemClicked,this) ;
		this.callParent() ;
	},
	
	arrangeItems: function() {
		var me = this,
			viewStore = me.getStore() ;
		
		if( me.getNodes().length != viewStore.getCount() ) {
			return ;
		}
		
		var currentGrp = -1,
			header,
			arrSeparators = [],
			arrArrItems = [] ;
		me.getStore().each( function(record) {
			if( record.get('type_header') ) {
				header = record ;
				return ;
			}
			if( record.get('type_separator') ) {
				currentGrp++ ;
				arrSeparators.push(record);
				arrArrItems.push([]) ;
				return ;
			}
			if( record.get('type_action') ) {
				arrArrItems[currentGrp].push(record) ;
				return ;
			}
		},me) ;
		
		
		// Box de la fenetre
		var viewBox = me.getEl().getBox(),
			viewWidth = viewBox.width,
			viewCenter = ( viewWidth / 2 ) ;
			
		var currentHeight = 0 ;
		
		// alignement du header
		var headerEl = Ext.get(me.getNode(header)),
			headerBox = headerEl.getBox(),
			headerHeight = headerBox.height,
			headerWidth = headerBox.width,
			headerLeft = ( viewCenter ) - ( headerWidth / 2 ) ;
		headerEl.setLeftTop( headerLeft , currentHeight ) ;
		currentHeight += headerHeight ;
		
		var separatorWidth = Math.min( 600, viewWidth ) ;
		
		
		var i, j, separatorEl, separatorBox ;
		for( i=0; i<arrSeparators.length ; i++ ) {
			separatorEl = Ext.get(me.getNode(arrSeparators[i])) ;
			separatorBox = separatorEl.getBox() ;
			
			separatorEl.setWidth(separatorWidth) ;
			separatorEl.setLeftTop( viewCenter-(separatorWidth/2) , currentHeight ) ;
			
			currentHeight += separatorBox.height ;
			
			var rowWidth = 0 , rowHeight = 0 ;
			for( j=0; j<arrArrItems[i].length ; j++ ) {
				var itemEl = Ext.get(me.getNode(arrArrItems[i][j])),
					itemBox = itemEl.getBox() ;
				rowWidth += itemBox.width ;
				if( itemBox.height > rowHeight ) {
					rowHeight = itemBox.height ;
				}
			}
			var xCursor = ( viewWidth - rowWidth ) / 2 ;
			for( j=0; j<arrArrItems[i].length ; j++ ) {
				var itemEl = Ext.get(me.getNode(arrArrItems[i][j])) ;
				// console.log( xCursor + ' ' +currentHeight ) ;
				itemEl.setLeftTop( xCursor, currentHeight ) ;
				xCursor += itemEl.getBox().width ;
				// console.dir( itemEl.getBox() ) ;
			}
			currentHeight += rowHeight ;
		}
	},
	itemClicked: function( view, record ) {
		var me = this ;
		if( record.get('type_action') && record.get('action_sendEvent') != '' ) {
			// console.log('Send event '+record.get('action_sendEvent') ) ;
			me.fireEvent('actionclick',view,record.get('action_sendEvent')) ;
		}
	}
	
}) ;