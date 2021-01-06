Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskPanel', {
	extend: 'Ext.panel.Panel',
	requires: ['Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskXmlBox'],
	_token: null,
	_safeNo: null,
	
	_onVisibleActive: false,
	
	_viewMode: null,
	_searchViewMode:null,
	_resultViewMode:null,
	
	
	initComponent: function () {
		var rawXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<svcOnlineOrderRequest lang="FR" version="2.1"><admin><client><contractId>45353</contractId><userPrefix>GEOCOM</userPrefix><userId>NN411025</userId><password>OICZ5M45OBMD</password><privateReference type="order">AE1296544</privateReference></client><context><appId version="1">WSOM</appId><date>2011-12-13T17:38:15+01:00</date></context></admin><request><id type="register" idName="SIREN">831549209</id><product range="101003" version="10"/><deliveryOptions><outputMethod>raw</outputMethod></deliveryOptions></request></svcOnlineOrderRequest>' ;

		Ext.apply(this, {
			//scrollable: 'vertical',
			//cls: 'ux-noframe-bg',
			bodyPadding: 8,
			//bodyCls: 'ux-noframe-bg',
			layout: 'fit',
			tbar: [{
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							this._viewMode = menuitem.itemId ;
							this.applyView() ;
						},
						scope:this
					},
					items: [{
						itemId: 'search',
						text: 'Recherche',
						iconCls: 'op5-spec-rsiveo-grid-view-ordergroup'
					},{
						itemId: 'result',
						text: 'Résultats',
						iconCls: 'op5-spec-rsiveo-grid-view-order'
					}]
				}
			},{
				hidden: true,
				itemId: 'tbSearch',
				flex: 1,
				border: false,
				xtype: 'toolbar',
				items: [{
					flex: 1,
					xtype: 'textfield'
				},{
					icon: 'images/modules/rsiveo-search-16.gif'
				}]
			},{
				hidden: true,
				itemId: 'tbResult',
				flex: 1,
				border: false,
				xtype: 'toolbar',
				items: ['->',{
					viewConfig: {forceFit: true},
					menu: {
						defaults: {
							handler:function(menuitem) {
								//console.log('ch view '+menuitem.itemId) ;
								//this._viewMode = menuitem.itemId ;
								//this.applyView() ;
							},
							scope:this
						},
						items: [{
							itemId: 'test1',
							text: 'test1',
							iconCls: 'op5-spec-rsiveo-grid-view-facture'
						},{
							itemId: 'test2',
							text: 'test2',
							iconCls: 'op5-spec-rsiveo-grid-view-facture'
						}]
					}
				}]
			}],
			items: [{
				xtype: 'box',
				style: {
					'display': 'table-cell',
					'vertical-align': 'middle',
					'text-align': 'center'
				},
				html: '<i>Aucun résultat associé</i>'
			}]
		});

		this.callParent();
		if( this._parentCmp ) {
			this.optimaModule = this._parentCmp.optimaModule ;
			//this._accId = this._parentCmp._accId ;
			this.mon(this._parentCmp,'doreload',this.onDoReload,this) ;
			this.on('show',this.onFirstVisible,this,{single: true}) ;
		}
	},
	onFirstVisible: function() {
		this._onVisibleActive = true ;
		
		//search or result ??
		
		//for test :
		this._viewMode = 'result' ;
		this.applyView() ;
	},
	onDoReload: function() {
		//parent has been reloaded
		// TODO
	},
	
	applyView: function() {
		var currentViewMode ;
		Ext.Array.each( this.down('toolbar').query('toolbar'), function(tbar) {
			if( !tbar.isVisible() ) {
				return ;
			}
			switch( tbar.itemId ) {
				case 'tbSearch' : currentViewMode='search' ; break ;
				case 'tbResult' : currentViewMode='result' ; break ;
				default : break ;
			}
			return false ;
		}) ;
		
		// Gestion toolbar
		if( currentViewMode == this._viewMode ) {
			return ;
		}
		
		var switchTbarVisible = '' ;
		switch( this._viewMode ) {
			case 'search' : switchTbarVisible='tbSearch' ; break ;
			case 'result' : switchTbarVisible='tbResult' ; break ;
			default : break ;
		}
		var menuItem = this.down('#tbViewmode').menu.down('#'+this._viewMode) ;
		//console.dir(this.down('#tbViewmode')) ;
		//console.dir(menuItem) ;
		if( menuItem ) {
			//console.dir(menuItem) ;
			this.down('#tbViewmode').setText( menuItem.text ) ;
			this.down('#tbViewmode').setIconCls( menuItem.iconCls ) ;
		}
		Ext.Array.each( this.down('toolbar').query('toolbar'), function(tbar) {
			tbar.setVisible( switchTbarVisible==tbar.itemId ) ;
		}) ;
		
		switch( this._viewMode ) {
			case 'search' : this.setupSearchMode() ; break ;
			case 'result' : this.setupResultMode() ; break ;
			default : break ;
		}
	},
	setupSearchMode: function() {
		this.buildWaitPanel() ;
		
		// resultat existant ?
		Ext.defer(function() {
			this.buildEmptyPanel() ;
		},2000,this) ;
	},
	setupResultMode: function() {
		this.buildWaitPanel() ;
	},
	buildWaitPanel: function() {
		this.removeAll() ;
		this.add({
			flex: 1,
			xtype: 'box',
			cls:'op5-waiting'
		});
	},
	buildEmptyPanel: function() {
		this.removeAll() ;
		this.add({
			xtype: 'box',
			style: {
				'display': 'table-cell',
				'vertical-align': 'middle',
				'text-align': 'center'
			},
			html: '<i>Aucun résultat associé</i>'
		});
	}
}) ;
