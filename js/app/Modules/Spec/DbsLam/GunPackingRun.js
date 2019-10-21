Ext.define('DbsLamGunPackingPendingModel',{
	extend: 'Ext.data.Model',
	idProperty: 'prod_id',
	fields: [
		{name: 'prod_id', type:'string'},
		{name: 'prod_gencod', type:'string'},
		{name: 'count_lig', type:'int'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.GunPackingRun',{
	extend:'Ext.panel.Panel',
	requires: [
		'Ext.grid.column.Action'
	],
	initComponent: function(){
		Ext.apply(this,{
			tbar: [{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},{
				icon: 'images/op5img/ico_print_16.png',
				text: '<b>'+this._printerUri+'</b>',
				handler: function() {
					
				},
				scope: this
			}],
			bbar: [{
				xtype:'textfield',
				itemId: 'txtScan',
				flex:1,
				listeners : {
					specialkey: {
						fn: function(field, e){
							if (e.getKey() == e.ENTER) {
								this.handleScan() ;
							}
						},
						scope: this
					},
					change: {
						fn: function(field) {
							this.handleScan(true) ;
						},
						delay: 200,
						scope: this
					}
				}
			},{
				xtype:'button',
				text: 'Send',
				handler : function(button,event) {
					this.handleScan() ;
				},
				scope : this
			}],
			border: false,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: '0px 8px',
				layout: 'anchor',
				fieldDefaults: {
					labelWidth: 120,
					anchor: '100%'
				},
				items: [{
					xtype: 'displayfield',
					name: 'transfer_txt',
					fieldLabel: 'Transfer',
					fieldStyle: 'font-weight:bold;'
				},{
					xtype: 'displayfield',
					name: 'src_adr',
					fieldLabel: 'Src.location',
					fieldStyle: 'font-weight:bold;'
				}]
			},{
				xtype: 'grid',
				flex: 1,
				store: {
					model: 'DbsLamGunPackingPendingModel',
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				columns: [{
					dataIndex: 'prod_id',
					width: 150,
					text: 'P/N'
				},{
					dataIndex: 'count_lig',
					text: 'Count'
				},{
					dataIndex: 'prod_gencod',
					width: 150,
					text: 'GenCod'
				}]
			}]
		});
		this.callParent() ;
		this.doLoadPackingSrc( this._transferligSrcAdr ) ;
	},
	openTransferLig: function(transferligFilerecordId) {
		this.fireEvent('opentransferlig',this,transferligFilerecordId) ;
	},
	
	doLoadPackingSrc: function(filterSrc) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferPacking_getSrcPending',
				filter_srcAdr: filterSrc
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText),
					transferligRecord = null ;
				if( !ajaxResponse.success ) {
					this.fireEvent('quit') ;
					return ;
				}
				this.onLoadSrcPending(ajaxResponse.header, ajaxResponse.data) ;
			},
			scope: this
		}) ;
	},
	onLoadSrcPending: function(ajaxHeader, ajaxData) {
		if( ajaxData.length==0 ) {
			this.fireEvent('quit') ;
			return ;
		}
		
		this.down('grid').getStore().loadData(ajaxData) ;
		this.down('form').getForm().setValues(ajaxHeader) ;
		
		this.down('#txtScan').reset() ;
		this.down('#txtScan').focus() ;
	},
	handleScan: function(noReturnMode=false) {
		var scanval = this.down('#txtScan').getValue() ;
		scanval = scanval.trim().toUpperCase() ;
		
		var scanvalGencod = scanval.toUpperCase().replace(/^0+/, '') ;
		
		var directProdId = null, gencodProdId = null, gencodMatches=0 ;
		this.down('grid').getStore().each( function(rec) {
			var recGencod = rec.get('prod_gencod').toUpperCase().replace(/^0+/, '') ;
			if( !Ext.isEmpty(recGencod) && !Ext.isEmpty(scanvalGencod) && scanvalGencod==recGencod ) {
				gencodProdId = rec.get('prod_id') ;
				gencodMatches++ ;
			}
			if( rec.get('prod_id') == scanval ) {
				directProdId = rec.get('prod_id') ;
			}
		}) ;
		if( directProdId && !noReturnMode ) {
			this.submitDirectCommit(directProdId) ;
			return ;
		}
		if( gencodProdId && gencodMatches==1 ) {
			this.submitDirectCommit(gencodProdId) ;
			return ;
		}
		
		// no match
		if( noReturnMode ) {
			return ;
		}
		this.doLoadPackingSrc( this._transferligSrcAdr ) ;
	},
	
	submitDirectCommit: function(prodId) {
		if( this.hasSubmitPending ) {
			return ;
		}
		this.showLoadmask() ;
		this.hasSubmitPending = true ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferPacking_directCommit',
				commit_srcAdr: this._transferligSrcAdr,
				commit_prodId: prodId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText),
					transferligRecord = null ;
				if( !ajaxResponse.success ) {
					this.hasSubmitPending = false ;
					Ext.MessageBox.alert('Error',(ajaxResponse.error||'Invalid item'), function() {
						this.doLoadPackingSrc( this._transferligSrcAdr ) ;
					},this) ;
					return ;
				}
				this.fireEvent('openpackingrecord', this, ajaxResponse.id) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	doQuit: function() {
		this.fireEvent('quit',this) ;
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
}) ;
