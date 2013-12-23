Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoFormPanel',{
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		var me = this,
			width = me.width ;
		
		me.addEvents('abort','confirm') ;
		
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'center'
			},
			bodyCls: 'op5-spec-mrfoxy-mainmenu',
			items:[
				Ext.apply(me.initHeaderCfg(),{
					width: width,
					height: 125
				}),{
					xtype:'box',
					html:'&#160;',
					height: 8
				},
				Ext.apply(me.initTabsCfg(),{
					width:width,
					flex:1
				})
			]
		});
		
		this.callParent() ;
		if( me.data ) {
			me.loadData(me.data) ;
		}
	},
	
	initHeaderCfg: function() {
		var headerCfg = {
			itemId: 'pHeader',
			xtype:'component',
			cls: 'op5-spec-mrfoxy-promoformheader',
			tpl: [
				'<div class="op5-spec-mrfoxy-promoformheader-wrap">',
					'<div class="op5-spec-mrfoxy-promoformheader-title">{title}</div>',
					'<div class="op5-spec-mrfoxy-promoformheader-caption">',
						'<span class="op5-spec-mrfoxy-promoformheader-captiontitle">Country</span>',
						'<span class="op5-spec-mrfoxy-promoformheader-captionbody">' ,
							'<div class="op5-spec-mrfoxy-promoformheader-captionicon" style="background-image:url({countryIcon})" ></div>',
							'<span class="op5-spec-mrfoxy-promoformheader-captionicontext">{countryDisplay}</span>',
						'</span>',
					'</div>',
					'<div class="op5-spec-mrfoxy-promoformheader-caption">',
						'<span class="op5-spec-mrfoxy-promoformheader-captiontitle">Brand</span>',
						'<span class="op5-spec-mrfoxy-promoformheader-captionbody">' ,
							'{brandDisplay}',
						'</span>',
					'</div>',
					'<div class="op5-spec-mrfoxy-promoformheader-icon"></div>',
					'<div class="op5-spec-mrfoxy-promoformheader-close"></div>',
				'</div>'
			]
		} ;
		
		return headerCfg ;
	},
	initTabsCfg: function() {
		var tabsCfg = {
			xtype:'panel',
			frame:true
		} ;
		return tabsCfg ;
	},
	
	loadData: function(data) {
		var me = this ;
		
		// prepare header data
		var headerData = {},
			headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl() ;
		if( data.header_promo_code ) {
			headerData['title'] = data.header_promo_code ;
		} else {
			headerData['title'] = 'New promotion' ;
		}
		if( data.header_countryCode ) {
			var row = Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetById(data.header_countryCode) ;
			if( row ) {
				headerData['countryIcon'] = row.get('country_iconurl') ;
				headerData['countryDisplay'] = row.get('country_display') ;
			}
		}
		if( data.header_brandCode ) {
			var row = Optima5.Modules.Spec.WbMrfoxy.HelperCache.brandGetById(data.header_brandCode) ;
			if( row ) {
				headerData['brandDisplay'] = row.get('brand_display') ;
			}
		}
		headerCmp.update(headerData) ;
		
		if( headerCmp.rendered ) {
			me.headerAttachEvent() ;
		} else {
			headerCmp.on('afterrender',function() {
				me.headerAttachEvent() ;
			},me) ;
		}
		
		/*
		var btnCloseEl = headerEl.query('div.op5-spec-mrfoxy-promoformheader-close') ;
		console.dir(headerEl) ;
		console.dir(btnCloseEl) ;
		*/
	},
	
	headerAttachEvent: function() {
		var me=this,
			headerCmp = me.getComponent('pHeader'),
			headerEl = headerCmp.getEl(),
			btnCloseEl = Ext.get(headerEl.query('div.op5-spec-mrfoxy-promoformheader-close')[0]) ;
		console.dir(headerEl) ;
		console.dir(btnCloseEl) ;
		btnCloseEl.un('click',me.onHeaderClose,me) ;
		btnCloseEl.on('click',me.onHeaderClose,me) ;
	},
	onHeaderClose: function(e,t) {
		var me = this ;
		Ext.MessageBox.confirm('Abort encoding','Abort new promo definition ?', function(buttonStr) {
			if( buttonStr=='yes' ) {
				me.sendAbort() ;
			}
		},me) ;
	},
	sendAbort: function() {
		var me = this ;
		me.fireEvent('abort',me) ;
	}
	
});