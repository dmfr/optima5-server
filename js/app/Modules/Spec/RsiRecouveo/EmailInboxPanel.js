Ext.define('Optima5.Modules.Spec.RsiRecouveo.EmailInboxPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		
	],
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'border',
			tbar:[{
				hidden: this._reportMode,
				icon: 'images/modules/rsiveo-back-16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				itemId: 'tbEmail',
				cfgParam_id: 'EMAIL',
				icon: 'images/modules/rsiveo-users-16.png',
				selectMode: 'SINGLE',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onEmailAccSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),'->',{
				iconCls: 'op5-spec-rsiveo-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doFetch() ;
				},
				scope: this
			}],
			items: [{
				//title: 'Statistiques sur sélection',
				region: 'east',
				//hidden: true,
				collapsible: true,
				collapsed: true,
				split: true,
				flex:1,
				border: true,
				xtype: 'panel',
				itemId: 'pEast',
				layout: 'fit',
				items: []
			},{
				region: 'center',
				flex:1,
				border: false,
				xtype: 'grid',
				itemId: 'pCenter',
				store: {
					autoLoad: true,
					model: 'RsiRecouveoEmailListModel',
					listeners: {
						beforeload: this.onBeforeLoad,
						scope: this
					},
					sorters: [{
						property: 'date',
						direction: 'DESC'
					}],
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_rsi_recouveo',
							_action: 'mail_getMboxGrid',
							filter_mbox: 'INBOX'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					})
				},
				columns: [{
					hidden: true,
					align: 'center',
					xtype:'checkcolumn',
					width:60
				},{
					text: 'Compte',
					dataIndex: 'email_local',
					width: 150,
				},{
					text: 'Date',
					dataIndex: 'date',
					width: 130,
					renderer: Ext.util.Format.dateRenderer('d/m/Y H:i')
				},{
					text: 'Correspondant',
					dataIndex: 'email_peer_name',
					width: 250
				},{
					text: 'Sujet',
					dataIndex: 'subject',
					width: 400
				},{
					text: '',
					dataIndex: 'has_attachments',
					width: 75,
					renderer: function(v,m,r) {
						if( v ) {
							m.tdCls += ' op5-spec-rsiveo-email-attachment' ;
						}
					}
				}],
				listeners: {
					selectionchange: function(gridpanel, selectedRecords) {
						var selRecord = selectedRecords[0] ;
						if( selRecord ) {
							this.installPreview(selRecord.getId()) ;
						}
					},
					scope: this
				},
				viewConfig: {
					enableTextSelection: true
				}
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			return ;
			if( this.down('gridpanel').getStore().loading || this.down('gridpanel').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		this.doLoad() ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		this.doLoad() ;
	},
	
	getGrid: function() {
		return this.down('#pCenter') ;
	},
	onBeforeLoad: function(store,options) {
		var arrEmailFilter ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( cfgParam_id=='EMAIL' ) {
				arrEmailFilter = cfgParamBtn.getLeafNodesKey() ;
			}
		}) ;
		
		var params = options.getParams() ;
		Ext.apply(params,{
			filter_emailAdr_arr: (arrEmailFilter ? Ext.JSON.encode(arrEmailFilter):''),
		}) ;
		options.setParams(params) ;
	},
	doLoad: function() {
		this.getGrid().getStore().load() ;
	},
	onEmailAccSet: function() {
		var cfgParamBtn = this.down('toolbar').down('#tbEmail') ;
		this.getGrid().headerCt.down('[dataIndex="email_local"]').setVisible( (cfgParamBtn.getValue()==null) ) ;
		
		this.doLoad() ;
	},
	
	
	doFetch: function() {
		var msgbox = Ext.Msg.wait('Récupération des messages...');
		this.optimaModule.getConfiguredAjaxConnection().request({
			timeout: (10 * 60 * 1000),
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_doFetch'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				this.doLoad() ;
			},
			callback: function() {
				msgbox.close() ;
			},
			scope: this
		}); 
	},
	
	
	installPreview: function(emailId) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'mail_getEmailRecord',
				email_filerecord_id: emailId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.down('#pEast').removeAll();
				this.down('#pEast').setTitle( ajaxResponse.subject ) ;
				this.down('#pEast').add(Ext.create('Ext.ux.dams.IFrameContent',{
					itemId: 'uxIFrame',
					content:ajaxResponse.html
				})) ;
				this.down('#pEast').expand() ;
			},
			scope: this
		}); 
	}
});
