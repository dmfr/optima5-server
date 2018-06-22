Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportFilesPanel', {
    extend: 'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetCharts',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetBalage'
	],

	initComponent: function () {
		Ext.apply(this,{
			_enableDates: false,
			//xtype: 'panel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items:[{
				xtype: 'panel',
				border: true,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetCharts',{
					itemId: 'northWidgetChart',
					title: 'Répartition statuts',
					width: 550
				}),{
					xtype:'box',
					width: 2,
					style: 'background-color: gray'
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetBalage', {
					itemId: 'northWidgetBalage',
					title: 'Balance agée par statut',
					flex: 1
				})]
			},{
				xtype: 'panel',
				border: true,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda', {
					flex: 1,
					itemId: 'centerWidgetAgendaCount',
					title: 'Agenda (nb dossiers)',
					_defaultMode: 'count',
					_hideForm: true
				}),,{
					xtype:'box',
					width: 2,
					style: 'background-color: gray'
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda', {
					flex: 1,
					itemId: 'centerWidgetAgendaAmount',
					title: 'Agenda (devise €)',
					_defaultMode: 'amount',
					_hideForm: true
				})]
			}]
		}),
		this.callParent() ;
		this.doLoad();
	},
	onTbarChanged: function( filterValues ) {
		this.doLoad() ;
	},
	doLoad: function() {
		var objAtrFilter = {}, arrSocFilter=null, arrUserFilter=null ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( Ext.isEmpty(cfgParamBtn.getValue()) ) {
				return ;
			}
			if( cfgParam_id.indexOf('ATR:')===0 ) {
				var atrId = cfgParam_id.substr(4) ;
				objAtrFilter[atrId] = cfgParamBtn.getValue()
			}
			if( cfgParam_id=='SOC' ) {
				arrSocFilter = cfgParamBtn.getLeafNodesKey() ;
			}
			if( cfgParam_id=='USER' ) {
				arrUserFilter = cfgParamBtn.getLeafNodesKey() ;
			}
		}) ;

		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getRecords',
				filter_atr: Ext.JSON.encode(objAtrFilter),
				filter_soc: (arrSocFilter ? Ext.JSON.encode(arrSocFilter):''),
				filter_user: (arrUserFilter ? Ext.JSON.encode(arrUserFilter):''),
				filter_archiveIsOn: (this.showClosed ? 1 : 0),
				load_address: (this.showAddress ? 1 : 0)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoad(ajaxResponse.data) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function( ajaxData ) {
		this.down('#northWidgetChart').loadFilesData( ajaxData ) ;
		this.down('#northWidgetBalage').loadFilesData( ajaxData ) ;
		this.down('#centerWidgetAgendaCount').loadFilesData( ajaxData ) ;
		this.down('#centerWidgetAgendaAmount').loadFilesData( ajaxData ) ;
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
			msg: RsiRecouveoLoadMsg.loadMsg
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
})
