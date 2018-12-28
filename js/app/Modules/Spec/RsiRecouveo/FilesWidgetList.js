Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetList', {
    extend: 'Ext.grid.Panel',
	requires: [
		'Ext.ux.grid.filters.filter.StringList',
		'Optima5.Modules.Spec.RsiRecouveo.UxGridFilters',
		'Ext.ux.CheckColumnNull'
	],
	_viewMode: null,
    initComponent: function(){
	    var statusMap = {} ;
	    Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
		    statusMap[status.status_id] = status ;
	    }) ;

	    var actionMap = {} ;
	    Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionAll(), function(action) {
		    actionMap[action.action_id] = action ;
	    }) ;
	    var actionnextMap = {} ;
	    Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionnextData(), function(actionnext) {
		    actionnextMap[actionnext.id] = actionnext ;
	    }) ;

	    var actionEtaMap = {} ;
	    Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getActionEtaAll(), function(actionEta) {
		    actionEtaMap[actionEta.eta_range] = actionEta ;
	    }) ;

	    var atrColumns = [] ;
	    Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
		    var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
		    if( !atrRecord.is_filter ) {
			    return ;
		    }
		    if( atrRecord.atr_type != 'account' ) {
			    return ;
		    }
		    //console.dir(atrRecord) ;
		    atrColumns.push({
			    cfgParam_id: 'ATR:'+atrRecord.atr_id,
			    cfgParam_atrType: atrRecord.atr_type,
			    text: atrRecord.atr_desc,
			    dataIndex: atrRecord.atr_field,
			    //rendererDataindex: atrRecord.bible_code + '_text',
			    width:120,
			    align: 'center'
		    }) ;
	    }) ;

	    var balageFields = [], balageColumns = [] ;
	    var balageRenderer = function(value,metaData,record) {
		    if( value == 0 ) {
			    return '&#160;' ;
		    }
		    return Ext.util.Format.number(value,'0,000.00') ;
	    };
	    var balageConvert = function(value,record) {
		    var thisField = this,
			    balageSegmtId = thisField.balageSegmtId ;
		    return record.data.inv_balage[balageSegmtId] ;
	    };
	    Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
		    var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
		    balageColumns.push({
			    text: balageSegmt.segmt_txt,
			    dataIndex: balageField,
			    width:90,
			    align: 'center',
			    renderer: balageRenderer,
			    filter: {
				    type: 'number'
			    },
			    summaryType: 'sum',
			    summaryRenderer: balageRenderer
		    }) ;

		    balageFields.push({
			    name: balageField,
			    balageSegmtId: balageSegmt.segmt_id,
			    type: 'number',
			    convert: balageConvert
		    });
	    }) ;



	    var factureColumns = [] ;
	    factureColumns.push({
		    hidden: true,
		    dataIndex: 'record_id',
		    align: 'center',
		    text: 'ID',
		    tdCls: 'op5-spec-dbstracy-boldcolumn',
		    filter: {
			    type: 'string'
		    }
	    },{
		    dataIndex: 'record_ref',
		    align: 'center',
		    text: 'Facture',
		    tdCls: 'op5-spec-dbstracy-boldcolumn',
		    filter: {
			    type: 'string'
		    }
	    },{
		    dataIndex: 'record_date',
		    text: 'Date',
		    align: 'center',
		    width: 90,
		    renderer: Ext.util.Format.dateRenderer('d/m/Y'),
		    filter: {
			    type: 'date'
		    }
	    },{
		    dataIndex: 'record_dateload',
		    text: 'Intégration',
		    align: 'center',
		    width: 90,
		    renderer: Ext.util.Format.dateRenderer('d/m/Y'),
		    filter: {
			    type: 'date'
		    }
	    },{
		    dataIndex: 'record_amount_raw',
		    text: 'Montant',
		    align: 'center',
		    renderer: Ext.util.Format.numberRenderer('0,000.00'),
		    filter: {
			    type: 'number'
		    },
		    summaryType: 'sum',
		    summaryRenderer: function(value,summaryData,field,metaData) {
			    return Ext.util.Format.number(value,'0,000.00') ;
		    }
	    },{
		    dataIndex: 'record_amount_calcpaid',
		    text: 'Payé',
		    align: 'center',
		    renderer: Ext.util.Format.numberRenderer('0,000.00'),
		    filter: {
			    type: 'number'
		    },
		    summaryType: 'sum',
		    summaryRenderer: function(value,summaryData,field,metaData) {
			    return Ext.util.Format.number(value,'0,000.00') ;
		    }
	    },{
		    dataIndex: 'record_xe_currency_amount',
		    text: 'MntDevise',
		    align: 'center',
		    renderer: function(v, meta, r) {
				if( Ext.isNumber(v) && !Ext.isEmpty(r.get('record_xe_currency_sign')) ) {
					v = Ext.util.Format.number(v,'0,000.00') ;
					v += '&#160;' ;
					v += r.get('record_xe_currency_sign') ;
					return v ;
				}
			 },
		    filter: {
			    type: 'number'
		    }
	    },{
		    dataIndex: 'record_xe_currency_code',
		    text: 'CodDevise',
		    align: 'center',
		    filter: {
			    type: 'stringlist'
		    }
	    }) ;
	    Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
		    var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
		    if( atrRecord.atr_type != 'record' ) {
			    return ;
		    }
		    factureColumns.push({
			    cfgParam_id: 'ATR:'+atrRecord.atr_id,
			    cfgParam_atrType: atrRecord.atr_type,
			    text: atrRecord.atr_desc,
			    dataIndex: atrRecord.atr_field,
			    //rendererDataindex: atrRecord.bible_code + '_text',
			    width:120,
			    align: 'center',
			    filter: {
				    type: 'string'
			    }
		    }) ;
	    }) ;
	    var factureFields = [
		    {name: 'record_filerecord_id', type: 'string'},
		    {name: 'record_id', type: 'string'},
		    {name: 'record_ref', type: 'string'},
		    {name: 'record_date', type: 'date', dateFormat:'Y-m-d H:i:s'},
		    {name: 'record_dateload', type: 'date', dateFormat:'Y-m-d H:i:s'},
		    {name: 'record_amount_raw', type: 'number'},
		    {name: 'record_amount_calcpaid', type: 'number'},
		    {name: 'record_xe_currency_amount', type: 'number'},
		    {name: 'record_xe_currency_sign', type: 'string'}
	    ] ;
	    Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
		    var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
		    if( atrRecord.atr_type != 'record' ) {
			    return ;
		    }
		    factureFields.push({
			    name: atrRecord.atr_field,
			    type: 'string'
		    }) ;
	    }) ;

	    var validBtn = Ext.create('Ext.button.Button',{
		    cls: 'op5-spec-rsiveo-checkcolumn-btn op5-spec-rsiveo-checkcolumn-submit',
		    iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save'
	    });
	    validBtnMarkup = Ext.DomHelper.markup(validBtn.getRenderTree());
	    validBtn.destroy() ;

	    var checkAllBtn = Ext.create('Ext.button.Button',{
		    cls: 'op5-spec-rsiveo-checkcolumn-btn op5-spec-rsiveo-checkcolumn-checkall x-grid-checkcolumn x-grid-checkcolumn-checked'
		    //iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save'
	    });
	    var checkAllBtnMarkup = Ext.DomHelper.markup(checkAllBtn.getRenderTree());
	    checkAllBtn.destroy() ;

	    var checkNoneBtn = Ext.create('Ext.button.Button',{
		    cls: 'op5-spec-rsiveo-checkcolumn-btn op5-spec-rsiveo-checkcolumn-checknone x-grid-checkcolumn'
		    //iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save'
	    });
	    var checkNoneBtnMarkup = Ext.DomHelper.markup(checkNoneBtn.getRenderTree());
	    checkNoneBtn.destroy() ;

	    var columns = [{
		    width: 70,
		    hidden: true,
		    xtype: 'uxnullcheckcolumn',
		    itemId: 'colMultiSelect',
		    sortable: false,
		    dataIndex: '_is_selection',
		    text: '<b><font color="red">Create</font></b>' + '<div align="center">' + validBtnMarkup + '</div>' + '<div align="center">' + checkAllBtnMarkup + '&#160;' + checkNoneBtnMarkup + '</div>',
		    isColumnCreate: true,
		    listeners: {
			    // attach event listener to buttonMarkup
			    afterrender: function(editingColumn) {
				    editingColumn.getEl().on( 'click', function(e,t) {
					    e.stopEvent() ;
					    this.handleMultiSelect() ;
				    },this,{delegate:'.op5-spec-rsiveo-checkcolumn-submit'}) ;
				    editingColumn.getEl().on( 'click', function(e,t) {
					    e.stopEvent() ;
					    if (this._dashboardMode == null || this._dashboardMode == false){
						    this.toggleMultiSelectAll(true);
					    }

				    },this,{delegate:'.op5-spec-rsiveo-checkcolumn-checkall'}) ;
				    editingColumn.getEl().on( 'click', function(e,t) {
					    e.stopEvent() ;
					    if (this._dashboardMode == null || this._dashboardMode == false){
						    this.toggleMultiSelectAll(false);
					    }
				    },this,{delegate:'.op5-spec-rsiveo-checkcolumn-checknone'}) ;
			    },
			    scope: this
		    }
	    },{
		    text: 'Affectation',
		    width:100,
		    dataIndex: 'link_user_txt',
		    renderer: function(v,m,r) {
			    if( valt = r.get('ext_user_txt') ) {
				    return valt ;
			    }
			    return v ;
		    },
		    filter: {
			    type: 'stringlist',
			    useFilters: true
		    },
	    },{
		    itemId: 'colAtr',
		    text: 'Attributs',
		    columns: atrColumns
	    },{
		    text: 'Débiteur',
		    columns: [{
			    text: 'Entité',
			    dataIndex: 'soc_txt',
			    tdCls: 'op5-spec-dbstracy-boldcolumn',
			    width:100,
			    align: 'center',
			    filter: {
				    type: 'stringlist',
				    useFilters: true
			    }
		    },{
			    text: 'No Compte',
			    dataIndex: 'acc_id',
			    tdCls: 'op5-spec-dbstracy-boldcolumn',
			    width:100,
			    align: 'center',
			    filter: {
				    type: 'string'
			    }
		    },{
			    text: 'Nom',
			    dataIndex: 'acc_txt',
			    width:150,
			    align: 'center',
			    filter: {
				    type: 'string'
			    }
		    },{
			    hidden: true,
			    hideable: false,
			    text: 'Nom',
			    dataIndex: 'adr_postal',
			    width:150,
			    align: 'left',
			    renderer: function(v) {
				    return Ext.util.Format.nl2br(v) ;
			    }
		    }]
	    },{
		    itemId: 'colStatus',
		    text: 'Statut',
		    align: 'center',
		    dataIndex: 'status_txt',
		    filter: {
			    type: 'stringlist',
			    useFilters: true
		    },
		    renderer: function(v,metaData,r) {
			    metaData.style += 'color: white ; background: '+r.get('status_color') ;
			    return v ;
		    }
	    },{
		    text: 'Prochaine action',
		    columns: [{
			    text: 'Action',
			    width: 140,
			    tdCls: 'op5-spec-dbstracy-boldcolumn',
			    align: 'center',
			    dataIndex: 'next_action_suffix_txt',
			    filter: {
				    type: 'stringlist',
				    useFilters: true
			    },
			    renderer: function(v,metaData,r) {
					 if( r.get('next_closed') ) {
						metaData.style += ' background: #aaaaaa ' ;
					 }
				    return v ;
			    }
		    },{
			    text: 'Date',
			    width: 100,
			    dataIndex: 'next_date',
			    align: 'center',
			    filter: {
				    type: 'date'
			    },
			    renderer: function(v,metaData,r) {
				    if( Ext.isEmpty(v) ) {
					    return '' ;
				    }
				    var etaValue = r.get('next_eta_range') ;
				    if( etaValue ) {
					    var actionEtaMap = this._actionEtaMap ;
					    if( actionEtaMap.hasOwnProperty(etaValue) ) {
						    var actionEtaData = actionEtaMap[etaValue] ;
						    metaData.style += 'background: '+actionEtaData.eta_color ;
					    }
				    }
				    var dateSql ;
				    dateSql = Ext.Date.format(v,'d/m/Y') ;
				    if( v.getHours() != 0 || v.getMinutes() != 0 ) {
					    dateSql += '&#160;' + '<font color="red"><b>' + Ext.Date.format(v,'H:i') + '</b></font>' ;
				    }
				    return dateSql;
			    }
		    }]
	    },{
		    itemId: 'colFinance',
		    text: 'Finance',
		    columns: [{
			    text: 'Nb Fact',
			    dataIndex: 'inv_nb',
			    tdCls: 'op5-spec-dbstracy-boldcolumn',
			    width:80,
			    align: 'center',
			    summaryType: 'sum',
			    summaryRenderer: function(value,summaryData,field,metaData) {
				    return value ;
			    },
			    filter: {
				    type: 'number'
			    }
		    },{
			    text: 'Montant',
			    dataIndex: 'inv_amount_total',
			    tdCls: 'op5-spec-dbstracy-boldcolumn',
			    width:100,
			    align: 'center',
			    filter: {
				    type: 'number'
			    },
			    renderer: function(value) {
				    return Ext.util.Format.number(value,'0,000.00') ;
			    },
			    summaryType: 'sum',
			    summaryRenderer: function(value,summaryData,field,metaData) {
				    return Ext.util.Format.number(value,'0,000.00') ;
			    }
		    },{
			    text: 'Solde',
			    dataIndex: 'inv_amount_due',
			    tdCls: 'op5-spec-dbstracy-boldcolumn',
			    width:100,
			    align: 'center',
			    filter: {
				    type: 'number'
			    },
			    renderer: function(value) {
				    return Ext.util.Format.number(value,'0,000.00') ;
			    },
			    summaryType: 'sum',
			    summaryRenderer: function(value,summaryData,field,metaData) {
				    return Ext.util.Format.number(value,'0,000.00') ;
			    }
		    }]
	    },{
		    hideable: true,
		    itemId: 'colFact',
		    text: 'Factures',
		    columns: factureColumns
	    },{
		    itemId: 'colBalage',
		    text: 'Balance âgée',
		    columns: balageColumns,
		    align: 'right'
	    }] ;

	    columns = {
		    defaults: {
			    menuDisabled: false,
			    draggable: false,
			    sortable: true,
			    hideable: false,
			    resizable: true,
			    groupable: false,
			    lockable: false
		    },
		    items: columns
	    }
	    this.tmpModelName = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getFileModel()+'-' + this.getId() + (++this.tmpModelCnt) ;
	    Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
	    Ext.define(this.tmpModelName, {
		    extend: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getFileModel(),
		    idProperty: 'id',
		    fields: Ext.Array.merge(factureFields,balageFields,[
			    {name: '_is_selection', type:'boolean'}
		    ])
	    });
        Ext.apply(this, {
	        xtype: 'grid',
	        columns: columns,
	        features: [{
		        ftype: 'summary',
		        dock: 'top'
	        }],
	        plugins: [{
		        ptype: 'rsiveouxgridfilters'
	        }],
	        store: {
		        model: this.tmpModelName,
		        data: [],
		        proxy: {
			        type: 'memory',
			        reader: {
				        type: 'json'
			        }
		        }
	        },
	        listeners: {
		        itemdblclick: function( view, record, itemNode, index, e ) {
		        	this.fireEvent('openaccount', record.get('acc_id'),record.get('file_filerecord_id')) ;
			        //this.handleOpenAccount(record.get('acc_id'),record.get('file_filerecord_id')) ;
		        },
		        scope :this
	        },
	        viewConfig: {
		        getRowClass: function(r) {
			        if( r.get('ext_user') ) {
				        return 'op5-spec-rsiveo-pom' ;
			        }
		        }
	        },
	        _statusMap: statusMap,
	        _actionMap: actionMap,
	        _actionnextMap: actionnextMap,
	        _actionEtaMap: actionEtaMap
        });

	    //console.log(this.down('#pGrid')) ;
        this.callParent() ;
    },
	configureGrid: function (cfgParamIds, showAddress, viewMode, disableXe=false) {
		this.headerCt.down('#colStatus').setVisible( !(viewMode=='account') ) ;
		//this.down('#pCenter').down('#pGrid').headerCt.down('#colAtr').setVisible( !(this.viewMode=='account') ) ;
		this.headerCt.down('#colAtr').items.each( function(col) {
			var doHide = false ;

			var atrColId = col.cfgParam_id ;
			if( !Ext.Array.contains(cfgParamIds,atrColId) ) {
				doHide = true ;
			}

			if( col.cfgParam_atrType=='record' && viewMode=='account' ) {
				doHide = true ;
			}

			col.setVisible(!doHide) ;
		},this) ;
		this.headerCt.down('#colFact').items.each( function(col) {
			var doHide = false ;

			var atrColId = col.cfgParam_id ;
			if( Ext.isEmpty(atrColId) ) {
				return ;
			}
			if( !Ext.Array.contains(cfgParamIds,atrColId) ) {
				doHide = true ;
			}

			col.setVisible(!doHide) ;
		},this) ;


		var isFactView = (viewMode=='record') ;
		this.headerCt.down('#colFinance').setVisible(!isFactView) ;
		this.headerCt.down('#colFact').setVisible(isFactView) ;
		this.headerCt.down('#colBalage').setVisible(!isFactView) ;

		var showAddress = (showAddress) ;
		this.headerCt.down('[dataIndex="adr_postal"]').setVisible(showAddress) ;
		
		var hasXe = !(disableXe) ;
		this.headerCt.down('[dataIndex="record_xe_currency_amount"]').setVisible(hasXe) ;
		this.headerCt.down('[dataIndex="record_xe_currency_code"]').setVisible(hasXe) ;
		
		this._viewMode = viewMode ;
	},

	loadFilesData: function( ajaxData, doClearFilters ){
	    if( this._viewMode == 'record' ) {
		    //var indexedFiles = [] ;
		    var newAjaxData = [] ;
		    Ext.Array.each( ajaxData, function(fileRow) {
			    var coef = ( (fileRow['inv_amount_total']!=0) ? (1-(fileRow['inv_amount_due']/fileRow['inv_amount_total'])) : 0 ) ;
			    if( coef > 1 ) {
				    //coef = 1 ;
			    }
			    Ext.Array.each(fileRow.records, function(fileRecordRow) {
				    if( !Ext.isEmpty(fileRecordRow['type']) ) {
					    return ;
				    }
				    var newRow = {} ;
				    Ext.apply(newRow,fileRow) ;
				    Ext.apply(newRow,fileRecordRow) ;
				    newRow['record_amount_raw'] =  fileRecordRow['amount'] ;
				    newRow['record_amount_calcpaid'] = fileRecordRow['amount'] * coef ;
				    newRow['record_dateload'] = fileRecordRow['date_load'] ;
				    newRow['record_date'] = fileRecordRow['date_record'] ;
				    newRow['record_xe_currency_amount'] = fileRecordRow['xe_currency_amount'] ;
				    newRow['record_xe_currency_sign'] = fileRecordRow['xe_currency_sign'] ;
				    newRow['record_xe_currency_code'] = fileRecordRow['xe_currency_code'] ;
				    newAjaxData.push(newRow) ;
			    });
		    });
		    ajaxData = newAjaxData ;
	    }

	    if( this._viewMode == 'account' ) {
		    var newAjaxData = {} ;
		    var c = 0 ;
		    Ext.Array.each( ajaxData, function(fileRow) {
			    var accId = fileRow['acc_id'] ;
			    if( !newAjaxData.hasOwnProperty(accId) ) {
				    c++ ;
				    newAjaxData[accId] = {
					    file_filerecord_id: fileRow['file_filerecord_id'],
					    acc_id: fileRow['acc_id'],
					    acc_txt: fileRow['acc_txt'],
					    inv_nb: 0,
					    inv_amount_due: 0,
					    inv_amount_total: 0,
					    inv_balage: {},
					    next_actions: []
				    } ;


				    var additionalData = {
					    soc_id: fileRow['soc_id'],
					    soc_txt: fileRow['soc_txt']
				    };
				    Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
					    var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId),
						    atrField = atrRecord.atr_field,
						    atrType = atrRecord.atr_type ;
					    if( atrType=='account' ) {
						    additionalData[atrField] = fileRow[atrField] ;
					    }
				    });
				    Ext.apply( newAjaxData[accId], additionalData) ;
			    }
			    newAjaxData[accId]['inv_amount_due'] += fileRow['inv_amount_due'] ;
			    newAjaxData[accId]['inv_amount_total'] += fileRow['inv_amount_total'] ;
			    newAjaxData[accId]['inv_nb'] += fileRow['inv_nb'] ;
			    Ext.Object.each( fileRow.inv_balage, function(k,v) {
				    if( !newAjaxData[accId].inv_balage.hasOwnProperty(k) ) {
					    newAjaxData[accId].inv_balage[k] = 0 ;
				    }
				    newAjaxData[accId].inv_balage[k] += v ;
			    }) ;
			    newAjaxData[accId]['next_actions'].push({
				    next_fileaction_filerecord_id: fileRow['next_fileaction_filerecord_id'],
				    next_action: fileRow['next_action'],
				    next_action_suffix_txt: fileRow['next_action_suffix_txt'],
				    next_date: fileRow['next_date'],
				    next_eta_range: fileRow['next_eta_range']
			    });
		    }) ;

		    var findNextFn = function(nextActions) {
			    var nextDate = null,
				    nextIdx = -1 ;

			    Ext.Array.each( nextActions, function(nextAction,idx) {
				    if( !nextAction.next_date ) {
					    return ;
				    }
				    if( nextDate == null || nextDate > nextAction.next_date ) {
					    nextDate = nextAction.next_date ;
					    nextIdx = idx ;
				    }
			    }) ;
			    if( nextIdx >= 0 ) {
				    return nextActions[nextIdx] ;
			    }
		    };
		    Ext.Object.each( newAjaxData, function(accId, accountRow) {
			    var nextAction ;
			    if( nextAction = findNextFn(accountRow.next_actions) ) {
				    Ext.apply( accountRow, nextAction ) ;
			    }
		    }) ;

		    ajaxData = Ext.Object.getValues(newAjaxData) ;
	    }




		// grid 
		if( doClearFilters ) {
			this.toggleMultiSelect(false) ;
			
			this.getStore().clearFilter() ;
			this.filters.clearFilters() ;
			
			this.getStore().sort('next_date','ASC') ;
		}
		this.getStore().loadRawData([]) ;
		Ext.Array.each( this.getColumns(), function(column) {
			if( column.filter && column.filter.type == 'stringlist' && !column.filter.active ) {
				column.filter.resetList() ; // HACK!
			}
		}) ;
		this.getStore().loadRawData(ajaxData) ;
	},
	
	toggleMultiSelect: function( torf ) {
		var column = this.headerCt.down('#colMultiSelect') ;
		if( torf === undefined ) {
			var torf = !column.isVisible()
		}
		if( this._viewMode != 'file' ) {
			torf = false ;
		}
		column.setVisible( torf ) ;
	},
	toggleMultiSelectAll: function(torf) {
		this.getStore().each( function(rec) {
			rec.set('_is_selection',torf) ;
			//rec.commit() ;
		}) ;
	},
	handleMultiSelect: function() {
		var ids = [] ;
		var gridPanel = this,
			gridPanelStore = gridPanel.getStore() ;
		gridPanelStore.each( function(r) {
			if( r.get('_is_selection') && !Ext.Array.contains(ids,r.get('file_filerecord_id')) ) {
				ids.push( r.get('file_filerecord_id') ) ;
			}
		}) ;
		
		this.fireEvent('multiselect',this,ids) ;
	}
})
