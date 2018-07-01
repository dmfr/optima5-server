Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportFilesPanel', {
	extend: 'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	alias: 'widget.op5specrsiveoreportfilespanel',
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetCharts',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda',
		'Optima5.Modules.Spec.RsiRecouveo.FilesWidgetBalage'
	],
	_ajaxData: null,
	_filesWidgetList : null,
	initComponent: function () {
		Ext.apply(this,{
			_hideDates: true,
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
					optimaModule: this.optimaModule,
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
					listeners: {
						agendaitemclick: this.onAgendaItemClick,
						scope: this
					},

					title: 'Agenda (nb dossiers)',
					_defaultMode: 'count',
					_dashboardMode: true,
					_hideForm: true,
					optimaModule: this.optimaModule
				}),,{
					xtype:'box',
					width: 2,
					style: 'background-color: gray'
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetAgenda', {
					flex: 1,
					itemId: 'centerWidgetAgendaAmount',
					title: 'Agenda (devise €)',
					_defaultMode: 'amount',
					_hideForm: true,
					listeners: {
						agendaitemclick: this.onAgendaItemClick,
						scope: this
					},
				})]
			}]
		}),
		this.callParent() ;
		this.on('beforedestroy',this.onBeforeDestroy,this) ;
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
				this._ajaxData = ajaxResponse.data;
				this.onLoad() ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function() {
		var ajaxData = this._ajaxData ;
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

	onAgendaItemClick: function( clickAgendaClass, clickEtaRange) {
		// Filtre par sociétés => params à affficher
		var tbSocsSelected ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( cfgParam_id=='SOC' ) {
				tbSocsSelected = cfgParamBtn.getLeafNodesKey() ;
			}
		}) ;
		var cfgParamIds = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(tbSocsSelected), function(atrId) {
			
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			cfgParamIds.push( 'ATR:'+atrRecord.atr_id ) ;
		}) ;
		
		
		
		
		// Masque
		if( !this.getEl() ) {
			return ;
		}
		this.getEl().mask() ;
		
		
		// Création du popup
		var curWidth = this.getEl().getWidth(),
			curHeight = this.getEl().getHeight() ;
		var filesWidgetList = Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetList', {
				//itemId: 'pGrid',
				height:(curHeight*0.8),
				width:(curWidth*0.8),
				floating: true,
				draggable: true,
				resizable: true,
				renderTo: this.getEl(),
				constrain: true,
				closable: true,
				frame: true,
				title: 'Files list'
		}) ;
		filesWidgetList.on('destroy', function(p){
			this.getEl().unmask() ;
			this._filesWidgetList = null ;
		},this,{single:true}) ;
		filesWidgetList.configureGrid(cfgParamIds, false, 'file') ;
		filesWidgetList.loadFilesData(this._ajaxData, true) ;
		filesWidgetList.getEl().alignTo(this.getEl(), 'c-c?');
		filesWidgetList.show();
		this._filesWidgetList = filesWidgetList ;
		
		
		
		// Filtres : TODO: déplacer dans FilesWidgetList
		var gridPanel = filesWidgetList,
			gridPanelStore = gridPanel.getStore(),
			gridPanelFilters = gridPanelStore.getFilters() ;

		var curAgendaClass, curEtaRange ;
		gridPanelFilters.each(function(filter) {
			switch( filter.getProperty() ) {
				case 'next_eta_range' :
					curEtaRange = filter.getValue() ;
					break ;
				case 'next_agenda_class' :
					curAgendaClass = filter.getValue() ;
					break ;
			}
		}) ;

		gridPanelStore.clearFilter() ;
		gridPanel.filters.clearFilters() ;
		if( curAgendaClass == clickAgendaClass && curEtaRange == clickEtaRange ) {
			Ext.Array.each( this.down('#pCenter').down('#pGrid').getColumns(), function(column) {
				if( column.filter && column.filter.type == 'stringlist' && !column.filter.active ) {
					column.filter.rebuildList() ; // HACK!
				}
			}) ;
			return ;
		}

		var filters = [] ;
		if( !Ext.isEmpty(clickAgendaClass) ) {
			filters.push({
				exactMatch : true,
				property : 'next_agenda_class',
				value    :  clickAgendaClass
			}) ;
		}
		if( !Ext.isEmpty(clickEtaRange) ) {
			filters.push({
				exactMatch : true,
				property : 'next_eta_range',
				value    : clickEtaRange
			}) ;
		}
		if( filters.length>0 ) {
			gridPanelStore.filter(filters) ;
		}

	},
	
	
	
	onBeforeDestroy: function() {
		if( this._filesWidgetList ) {
			this._filesWidgetList.destroy() ;
		}
	}
})
