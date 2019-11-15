Ext.define('RsiRecouveoMenuItemModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'type_header',  type: 'boolean'},
		{name: 'type_separator',   type: 'boolean'},
		{name: 'type_action',   type: 'boolean'},
		{name: 'type_action_blank',   type: 'boolean'},
		{name: 'separator_label',   type: 'string'},
		{name: 'action_iconCls',   type: 'string'},
		{name: 'action_qtip',   type: 'string'},
		{name: 'action_caption',   type: 'string'},
		{name: 'action_sendEvent', type:'string'}
	]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.MainMenu',{
	extend:'Ext.view.View',
	requires:[
	],
	
	initComponent: function() {
		var helperCache = Optima5.Modules.Spec.RsiRecouveo.HelperCache,
			authHasAll = helperCache.authHelperHasAll(),
			authProfile = helperCache.authHelperGetProfile(),
			authIsExt = helperCache.authHelperIsExt(),
			authIsDemo = helperCache.authHelperIsDemo(),
			modeSaas = !Ext.isEmpty(helperCache.getMetagenValue('gen_uimode_saas')) ;
		
		 var viewItemTpl = new Ext.XTemplate(
			'<tpl for=".">',
			'<div class="op5-spec-rsiveo-mainmenu-item">',
				'<tpl if="type_header">',
					'<div class="op5-spec-rsiveo-mainmenu-header"></div>',
				'</tpl>',
				
				'<tpl if="type_separator">',
					'<div class="x-clear"></div>',
					'<div class="op5-spec-rsiveo-mainmenu-separator">{separator_label}</div>',
				"</tpl>",
			
				'<tpl if="type_action">',
					'<tpl if="!type_action_blank">',
						'<div class="op5-spec-rsiveo-mainmenu-action">',
							'<div class="op5-spec-rsiveo-mainmenu-action-icon {action_iconCls}" data-qtip="{action_qtip:htmlEncode}"></div>',
							'<span>{action_caption:htmlEncode}</span>',
						'</div>',
					'</tpl>',
					'<tpl if="type_action_blank">',
						'<div class="op5-spec-rsiveo-mainmenu-action">',
						'</div>',
					'</tpl>',
				'</tpl>',
			'</div>',
			'</tpl>'
		);
		 
		var menuData = [
				{type_header:true},
				{type_separator:true, separator_label: 'Opérations'},
				{type_action:true, action_caption: 'Gestion Dossiers', action_sendEvent:'files', action_iconCls:'op5-spec-rsiveo-mmenu-agenda'},
				{type_action:true, type_action_blank:true},
				{type_action:true, action_caption: 'Reporting', action_sendEvent:'reports', action_iconCls:'op5-spec-rsiveo-mmenu-agenda'},
				{type_action:true, action_caption: 'Dashboard', action_sendEvent:'tiles', action_iconCls:'op5-spec-rsiveo-mmenu-agenda'},
				{type_action:true, action_caption: 'Nouveau dashboard', action_sendEvent:'dashboard', action_iconCls:'op5-spec-rsiveo-mmenu-agenda'},
				{type_action:true, type_action_blank:true},
				{type_action:true, action_caption: 'Enveloppes / Envoi', action_sendEvent:'envbrowser', action_iconCls:'op5-spec-rsiveo-mmenu-mailout'},
				{type_action:true, action_caption: 'Courrier entrant', action_sendEvent:'form_inbox', action_iconCls:'op5-spec-rsiveo-mmenu-mailin'},
				{type_action:true, action_caption: 'Email reçus', action_sendEvent:'form_email', action_iconCls:'op5-spec-rsiveo-mmenu-mailin'},
				{type_action:true, action_caption: 'Affectation bancaire', action_sendEvent:'bank', action_iconCls:'op5-spec-rsiveo-mmenu-recordtemp'},
				{type_separator:true, separator_label: 'Administration'},
				{type_action:true, action_caption: 'Configuration', action_sendEvent:'cfg', action_iconCls:'op5-spec-rsiveo-mmenu-cfg'},
				{type_action:true, action_caption: 'Bloc Notes', action_sendEvent:'notepad', action_iconCls:'op5-spec-rsiveo-mmenu-notepad'},
				{type_action:true, action_caption: 'Upload / Sync', action_sendEvent:'form_upload', action_iconCls:'op5-spec-rsiveo-mmenu-upload'},
				{type_action:true, action_caption: 'Réinitialisation Demo', action_sendEvent:'form_copydemo', action_iconCls:'op5-spec-rsiveo-mmenu-upload'}
		];
		if( authIsExt ) {
			menuData = [
				{type_header:true},
				{type_separator:true, separator_label: 'Opérations'},
				{type_action:true, action_caption: 'Gestion Dossiers', action_sendEvent:'files', action_iconCls:'op5-spec-rsiveo-mmenu-agenda'},
				{type_action:true, type_action_blank:true},
				{type_action:true, action_caption: 'Boîte de réception', action_sendEvent:'form_inbox', action_iconCls:'op5-spec-rsiveo-mmenu-mailin'}
			];
		}
		
		if( modeSaas ) {
			var menuData = [] ;
			if( authHasAll ) {
				menuData = [
					{type_header:true},
					{type_separator:true, separator_label: 'Opérations'},
					{type_action:true, action_caption: 'Gestion Dossiers', action_sendEvent:'files', action_iconCls:'op5-spec-rsiveo-mmenu-agenda'},
					{type_action:true, action_caption: 'Aide en ligne', action_sendEvent:'help_wiki', action_iconCls:'op5-spec-rsiveo-mmenu-help'},
					{type_action:true, type_action_blank:true},
					{type_action:true, action_caption: 'Reporting', action_sendEvent:'dashboard', action_iconCls:'op5-spec-rsiveo-mmenu-agenda'},
					{type_action:true, type_action_blank:true},
					{type_action:true, action_caption: 'Enveloppes / Envoi', action_sendEvent:'envbrowser', action_iconCls:'op5-spec-rsiveo-mmenu-mailout'},
					{type_action:true, action_caption: 'Courrier entrant', action_sendEvent:'form_inbox', action_iconCls:'op5-spec-rsiveo-mmenu-mailin'},
					{type_action:true, action_caption: 'Email reçus', action_sendEvent:'form_email', action_iconCls:'op5-spec-rsiveo-mmenu-mailin'},
					{type_separator:true, separator_label: 'Administration'},
					{type_action:true, action_caption: 'Configuration', action_sendEvent:'cfg', action_iconCls:'op5-spec-rsiveo-mmenu-cfg'},
					{type_action:true, action_caption: 'Upload / Sync', action_sendEvent:'form_upload', action_iconCls:'op5-spec-rsiveo-mmenu-upload'},
					{type_action:true, action_caption: 'Réinitialisation Demo', action_sendEvent:'form_copydemo', action_iconCls:'op5-spec-rsiveo-mmenu-upload'}
				];
			} else {
				switch( authProfile ) {
					case 'CR' :
					default :
						menuData = [
							{type_header:true},
							{type_separator:true, separator_label: 'Opérations'},
							{type_action:true, action_caption: 'Gestion Dossiers', action_sendEvent:'files', action_iconCls:'op5-spec-rsiveo-mmenu-agenda'},
							{type_action:true, action_caption: 'Aide en ligne', action_sendEvent:'help_wiki', action_iconCls:'op5-spec-rsiveo-mmenu-help'},
							{type_action:true, type_action_blank:true},
							{type_action:true, action_caption: 'Enveloppes / Envoi', action_sendEvent:'envbrowser', action_iconCls:'op5-spec-rsiveo-mmenu-mailout'},
							{type_action:true, action_caption: 'Courrier entrant', action_sendEvent:'form_inbox', action_iconCls:'op5-spec-rsiveo-mmenu-mailin'},
							{type_action:true, action_caption: 'Email reçus', action_sendEvent:'form_email', action_iconCls:'op5-spec-rsiveo-mmenu-mailin'},
							{type_separator:true, separator_label: 'Administration'},
							{type_action:true, action_caption: 'Profil', action_sendEvent:'passwd', action_iconCls:'op5-spec-rsiveo-mmenu-passwd'}
						];
						break ;
				}
				if( authIsExt ) {
					menuData = [
						{type_header:true},
						{type_separator:true, separator_label: 'Opérations'},
						{type_action:true, action_caption: 'Gestion Dossiers', action_sendEvent:'files', action_iconCls:'op5-spec-rsiveo-mmenu-agenda'}
					];
				}
			}
		}
		 
		var itemsStore = Ext.create('Ext.data.Store',{
			model:'RsiRecouveoMenuItemModel',
			data:menuData
		}) ;
		 
		Ext.apply(this,{
			cls: 'op5-spec-rsiveo-mainmenu',
			tpl: viewItemTpl,
			itemSelector: 'div.op5-spec-rsiveo-mainmenu-item',
			overItemCls: 'op5-spec-rsiveo-mainmenu-item-over',
			store: itemsStore,
			stateId: "mainmenu",
			stateful: true
		}) ;
		
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
		headerEl.setLocalXY( headerLeft , currentHeight ) ;
		currentHeight += headerHeight ;
		
		var separatorWidth = Math.min( 600, viewWidth ) ;
		
		
		var i, j, separatorEl, separatorBox ;
		for( i=0; i<arrSeparators.length ; i++ ) {
			separatorEl = Ext.get(me.getNode(arrSeparators[i])) ;
			separatorBox = separatorEl.getBox() ;
			
			separatorEl.setWidth(separatorWidth) ;
			separatorEl.setLocalXY( viewCenter-(separatorWidth/2) , currentHeight ) ;
			
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
				itemEl.setLocalXY( xCursor, currentHeight ) ;
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
